import { Module, Global } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { ChatService } from '../service/chat/chat.service';
import { MessageRepository } from '../repository/message.repository';
import { UserRepository } from '../repository/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../model/chat/message.entity';
import { User } from '../model/user/user.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Message, User])],
    providers: [WsGateway, ChatService, MessageRepository, UserRepository],
    exports: [WsGateway, ChatService, UserRepository],
})
export class WsModule {}
