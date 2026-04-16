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
    async getConversationList(userId: number): Promise<Message[]> {
        const allMessages = await this.find({
            where: [
                { senderId: userId },
                { receiverId: userId },
            ],
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });

        // Keep only the latest message per conversation partner
        const seen = new Map<number, Message>();
        for (const msg of allMessages) {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!seen.has(partnerId)) {
                seen.set(partnerId, msg);
            }
        }

        return Array.from(seen.values());
    }

    async markAsRead(senderId: number, receiverId: number): Promise<void> {
        await this.update(
            { senderId, receiverId, isRead: false },
            { isRead: true },
        );
    }
}
