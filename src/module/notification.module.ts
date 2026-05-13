import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Notification } from '../model/notification/notification.entity';
import { NotificationRepository } from '../repository/notification.repository';
import { NotificationService } from '../service/notification/notification.service';
import { NotificationController } from '../controller/notification/notification.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'SECRET',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [NotificationController],
    providers: [
        NotificationService,
        NotificationRepository,
    ],
    exports: [NotificationService],
})
export class NotificationModule {}
