import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notification } from '../model/notification/notification.entity';
import { NotificationType } from '../model/notification/notification-type.enum';

@Injectable()
export class NotificationRepository extends Repository<Notification> {
    constructor(private dataSource: DataSource) {
        super(Notification, dataSource.createEntityManager());
    }

    async createNotification(
        userId: number,
        type: NotificationType,
        message: string,
        relatedId?: number,
    ): Promise<Notification> {
        const notification = this.create({
            userId,
            type,
            message,
            relatedId,
        });
        return this.save(notification);
    }

    async findByUser(userId: number): Promise<Notification[]> {
        return this.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 20, // Keep only recent notifications
        });
    }

    async markAllAsRead(userId: number): Promise<void> {
        await this.update({ userId, isRead: false }, { isRead: true });
    }

    async markOneAsRead(id: number, userId: number): Promise<void> {
        await this.update({ id, userId }, { isRead: true });
    }
}
