import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from '../service/chat/chat.service';
import { parse as parseCookie } from 'cookie';
import { Logger } from '@nestjs/common';

interface AuthSocket extends Socket {
    userId: number;
}

@WebSocketGateway({
    cors: {
        origin: true,
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'ngrok-skip-browser-warning',
        ],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS']
    },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(WsGateway.name);

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(client: AuthSocket) {
        try {
            const rawCookies = client.handshake.headers.cookie || '';
            const cookies = parseCookie(rawCookies);
            const token = cookies['access_token'];

            if (!token) {
                this.logger.warn(`Connection rejected: No token for socket ${client.id}`);
                client.emit('error', { message: 'Unauthorized: No token provided' });
                return client.disconnect();
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'SECRET',
            });

            client.userId = payload.sub;

            const roomName = `user:${client.userId}`;
            await client.join(roomName);

            this.logger.log(`User ${client.userId} connected and joined room ${roomName}`);
        } catch (err) {
            this.logger.error(`Auth failed for socket ${client.id}: ${err.message}`);
            client.emit('error', { message: 'Unauthorized: Invalid or expired token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        if (client.userId) {
            this.logger.log(`User ${client.userId} disconnected (socket ${client.id})`);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { receiverId: number; content: string },
    ) {
        if (!client.userId) return;

        const message = await this.chatService.sendMessage(
            client.userId,
            data.receiverId,
            data.content,
        );

        this.server.to(`user:${client.userId}`).emit('messageSent', message);
        this.server.to(`user:${data.receiverId}`).emit('newMessage', message);

        return message;
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { withUserId: number },
    ) {
        if (!client.userId) return;

        await this.chatService.markAsRead(client.userId, data.withUserId);

        this.server.to(`user:${data.withUserId}`).emit('messagesRead', { byUserId: client.userId });
    }

    @SubscribeMessage('getConversation')
    async handleGetConversation(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { withUserId: number },
    ) {
        if (!client.userId) return;
        const messages = await this.chatService.getConversation(client.userId, data.withUserId);
        client.emit('conversationHistory', messages);
    }

    @SubscribeMessage('getConversationList')
    async handleGetConversationList(@ConnectedSocket() client: AuthSocket) {
        if (!client.userId) return;
        const list = await this.chatService.getConversationList(client.userId);
        client.emit('conversationList', list);
    }

    emitToUser(userId: number, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}
