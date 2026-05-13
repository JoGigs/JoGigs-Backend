import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRepository } from '../../repository/message.repository';
import { UserRepository } from '../../repository/user.repository';
import { Message } from '../../model/chat/message.entity';

@Injectable()
export class ChatService {
    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly userRepository: UserRepository,
    ) { }

    async sendMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
        if (senderId === receiverId) {
            throw new NotFoundException('Cannot send a message to yourself');
        }

        const receiver = await this.userRepository.findById(receiverId);
        if (!receiver) throw new NotFoundException(`User ${receiverId} not found`);

        const message = await this.messageRepository.saveMessage(senderId, receiverId, content);

        return message;
    }

    async getConversation(userAId: number, userBId: number): Promise<Message[]> {
        const other = await this.userRepository.findById(userBId);
        if (!other) throw new NotFoundException(`User ${userBId} not found`);

        // Mark messages sent by userB to userA as read
        await this.messageRepository.markAsRead(userBId, userAId);

        return this.messageRepository.getConversation(userAId, userBId);
    }

    async getConversationList(userId: number): Promise<any[]> {
        return this.messageRepository.getConversationList(userId);
    }

    async markAsRead(userId: number, fromUserId: number): Promise<void> {
        await this.messageRepository.markAsRead(fromUserId, userId);
    }
}
