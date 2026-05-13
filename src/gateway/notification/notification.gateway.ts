import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { parse as parseCookie } from 'cookie';

interface AuthSocket extends Socket {
    userId: number;
}

@WebSocketGateway({
    cors: {
        origin: "*",
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map of userId -> Set<socketId>
    private connectedUsers = new Map<number, Set<string>>();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: AuthSocket) {
        try {
            const rawCookies = client.handshake.headers.cookie || '';
            const cookies = parseCookie(rawCookies);
            const token = cookies['access_token'];

            if (!token) return client.disconnect();

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            client.userId = payload.sub;
            const existing = this.connectedUsers.get(payload.sub) ?? new Set<string>();
            existing.add(client.id);
            this.connectedUsers.set(payload.sub, existing);

            console.log(`[Notification] User ${payload.sub} connected → socket ${client.id}`);
        } catch (err) {
            console.error(`[Notification] Auth failed for socket ${client.id}:`, err.message);
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
        }
    }

    /**
     * Send a live notification to a specific user
     */
    sendNotification(userId: number, data: any) {
        const sockets = this.connectedUsers.get(userId);
        if (sockets) {
            sockets.forEach(socketId => {
                this.server.to(socketId).emit('notification', data);
            });
        }
    }

    /**
     * Broadcast a global event to trigger a data refresh (e.g., booking_updated)
     */
    broadcastUpdate(userId: number, event: string, data: any) {
        const sockets = this.connectedUsers.get(userId);
        console.log(`[Notification] Broadcasting '${event}' to user ${userId} (${sockets?.size || 0} sockets)`);
        if (sockets) {
            sockets.forEach(socketId => {
                this.server.to(socketId).emit(event, data);
            });
        }
    }
}
