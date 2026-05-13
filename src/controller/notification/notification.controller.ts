import { Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from '../../service/notification/notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get()
    getNotifications(@Req() req: Request) {
        const userId = (req as any).user.sub;
        return this.notificationService.getNotifications(userId);
    }

    @Post('read-all')
    markAllAsRead(@Req() req: Request) {
        const userId = (req as any).user.sub;
        return this.notificationService.markAsRead(userId);
    }

    @Post(':id/read')
    markOneAsRead(@Req() req: Request) {
        const userId = (req as any).user.sub;
        const id = parseInt(req.params.id as string, 10);
        return this.notificationService.markOneAsRead(id, userId);
    }
}
