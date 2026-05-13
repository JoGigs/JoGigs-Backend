import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Message } from '../model/chat/message.entity';

@Injectable()
export class MessageRepository extends Repository<Message> {
    constructor(private dataSource: DataSource) {
        super(Message, dataSource.createEntityManager());
    }

    async saveMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
        const message = this.create({ senderId, receiverId, content });
        return this.save(message);
    }

    /**
     * Returns the full conversation between two users, oldest first.
     */
    async getConversation(userAId: number, userBId: number): Promise<Message[]> {
        return this.find({
            where: [
                { senderId: userAId, receiverId: userBId },
                { senderId: userBId, receiverId: userAId },
            ],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Returns the latest message per unique conversation the user is part of.
     * Fetches all relevant messages then groups in JS to avoid complex SQL.
     */
    async getConversationList(userId: number): Promise<any[]> {
        const uId = Number(userId);
        const allMessages = await this.find({
            where: [
                { senderId: uId },
                { receiverId: uId },
            ],
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });

        // Keep only the latest message per conversation partner
        const seen = new Map<number, Message>();
        for (const msg of allMessages) {
            const partnerId = msg.senderId === uId ? msg.receiverId : msg.senderId;
            if (!seen.has(partnerId)) {
                seen.set(partnerId, msg);
            }
        }

        return Array.from(seen.values()).map(msg => {
            const isSender = msg.senderId === uId;
            const partner = isSender ? msg.receiver : msg.sender;
            return {
                id: msg.id,
                content: msg.content,
                createdAt: msg.createdAt,
                isRead: isSender ? true : msg.isRead, // If I am the sender, the message is not 'unread' for me
                withUserId: partner?.id || (isSender ? msg.receiverId : msg.senderId),
                withUserName: partner?.fullName || 'Unknown User',
            };
        }) as any; // Type as any since we are returning a mapped object, or change return type
    }

    async markAsRead(senderId: number, receiverId: number): Promise<void> {
        await this.update(
            { senderId, receiverId, isRead: false },
            { isRead: true },
        );
    }
}
