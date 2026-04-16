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
import { ChatService } from '../../service/chat/chat.service';
import { parse as parseCookie } from 'cookie';

interface AuthSocket extends Socket {
    userId: number;
}

@WebSocketGateway({
    cors: {
        origin: /^http:\/\/localhost(:\d+)?$/, // TODO: tighten this in production if ever deployed
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map of userId -> socketId for routing messages
    private connectedUsers = new Map<number, string>();

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
    ) { }


    // btw this function has its own auth logic so it doesn't need the JwtAuthGuard
    async handleConnection(client: AuthSocket) {
        try {
            const rawCookies = client.handshake.headers.cookie || '';
            const cookies = parseCookie(rawCookies);
            const token = cookies['access_token'];

            if (!token) {
                client.emit('error', { message: 'Unauthorized: no token' });
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            client.userId = payload.sub;
            this.connectedUsers.set(payload.sub, client.id);

            console.log(`[Chat] User ${payload.sub} connected → socket ${client.id}`);
        } catch {
            client.emit('error', { message: 'Unauthorized: invalid token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            console.log(`[Chat] User ${client.userId} disconnected`);
        }
    }

    /**
     * Client emits:  { receiverId: number, content: string }
     * Server emits to receiver (if online): 'newMessage' event with the saved message
     */
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { receiverId: number; content: string },
    ) {
        const senderId = client.userId;
        if (!senderId) {
            return client.emit('error', { message: 'Unauthorized' });
        }

        const message = await this.chatService.sendMessage(
            senderId,
            data.receiverId,
            data.content,
        );

        // Echo back to sender with the saved message (has id + createdAt)
        client.emit('messageSent', message);

        // Deliver to receiver if they are online
        const receiverSocketId = this.connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('newMessage', message);
        }

        return message;
    }

    /**
     * Client emits:  { withUserId: number }
     * Server emits back: 'conversationHistory' with array of messages
     */
    @SubscribeMessage('getConversation')
    async handleGetConversation(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { withUserId: number },
    ) {
        const senderId = client.userId;
        if (!senderId) {
            return client.emit('error', { message: 'Unauthorized' });
        }

        const messages = await this.chatService.getConversation(senderId, data.withUserId);
        client.emit('conversationHistory', messages);
        return messages;
    }

    /**
     * Client emits:  (no body)
     * Server emits back: 'conversationList' with latest message per conversation
     */
    @SubscribeMessage('getConversationList')
    async handleGetConversationList(@ConnectedSocket() client: AuthSocket) {
        const userId = client.userId;
        if (!userId) {
            return client.emit('error', { message: 'Unauthorized' });
        }

        const list = await this.chatService.getConversationList(userId);
        client.emit('conversationList', list);
        return list;
    }
}
