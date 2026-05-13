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
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map of userId -> Set<socketId> so multi-tab users all receive messages
    private connectedUsers = new Map<number, Set<string>>();

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
            const existing = this.connectedUsers.get(payload.sub) ?? new Set<string>();
            existing.add(client.id);
            this.connectedUsers.set(payload.sub, existing);

            console.log(`[Chat] User ${payload.sub} connected → socket ${client.id}`);
        } catch {
            client.emit('error', { message: 'Unauthorized: invalid token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        if (client.userId) {
            const sockets = this.connectedUsers.get(client.userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) this.connectedUsers.delete(client.userId);
            }
            console.log(`[Chat] User ${client.userId} disconnected (socket ${client.id})`);
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

        // Deliver to all of receiver's connected sockets (multi-tab support)
        const receiverSockets = this.connectedUsers.get(data.receiverId);
        if (receiverSockets) {
            receiverSockets.forEach((socketId) =>
                this.server.to(socketId).emit('newMessage', message),
            );
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



    notifyMessagesRead(userId: number, byUserId: number) {
        const sockets = this.connectedUsers.get(byUserId);
        if (sockets) {
            sockets.forEach((socketId) =>
                this.server.to(socketId).emit('messagesRead', { byUserId: userId }),
            );
        }
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { withUserId: number },
    ) {
        const userId = client.userId;
        if (!userId) {
            return client.emit('error', { message: 'Unauthorized' });
        }

        await this.chatService.markAsRead(userId, data.withUserId);
        
        // Notify sender that messages were read
        this.notifyMessagesRead(userId, data.withUserId);
    }
}
