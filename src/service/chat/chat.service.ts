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
        const receiver = await this.userRepository.findById(receiverId);
        if (!receiver) throw new NotFoundException(`User ${receiverId} not found`);

        return this.messageRepository.saveMessage(senderId, receiverId, content);
    }

    async getConversation(userAId: number, userBId: number): Promise<Message[]> {
        const other = await this.userRepository.findById(userBId);
        if (!other) throw new NotFoundException(`User ${userBId} not found`);

        // Mark messages sent by userB to userA as read
        await this.messageRepository.markAsRead(userBId, userAId);

        return this.messageRepository.getConversation(userAId, userBId);
    }

    async getConversationList(userId: number): Promise<Message[]> {
        return this.messageRepository.getConversationList(userId);
    }
}
