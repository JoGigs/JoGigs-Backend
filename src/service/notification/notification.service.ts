import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../repository/notification.repository';
import { WsGateway } from '../../gateway/ws.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { Booking } from '../../model/booking/booking.entity';
import { BookingStatus } from '../../model/booking/booking-status.enum';
import { NotificationType } from '../../model/notification/notification-type.enum';
import { Notification } from '../../model/notification/notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly wsGateway: WsGateway,
    ) { }

    /**
     * Create a notification and emit it live
     */
    async notify(
        userId: number,
        type: NotificationType,
        message: string,
        relatedId?: number,
    ): Promise<Notification> {
        const notification = await this.notificationRepository.createNotification(
            userId,
            type,
            message,
            relatedId,
        );

        // Emit real-time notification
        this.wsGateway.emitToUser(userId, 'notification', notification);
        
        // Also emit a general refresh event for the frontend
        this.wsGateway.emitToUser(userId, 'booking_updated', { bookingId: relatedId });

        return notification;
    }

    async getNotifications(userId: number): Promise<Notification[]> {
        return this.notificationRepository.findByUser(userId);
    }

    async markAsRead(userId: number): Promise<void> {
        await this.notificationRepository.markAllAsRead(userId);
    }

    async markOneAsRead(id: number, userId: number): Promise<void> {
        await this.notificationRepository.markOneAsRead(id, userId);
    }

    async refreshOnly(userId: number, relatedId: number) {
        this.wsGateway.emitToUser(userId, 'booking_updated', { bookingId: relatedId });
    }

    // --- EVENT HANDLERS ---

    @OnEvent('booking.created', { async: true })
    async handleBookingCreated(booking: Booking) {
        // Notify Professional
        await this.notify(
            booking.serviceListing.professionalId,
            NotificationType.BOOKING_REQUESTED,
            `New service request for "${booking.serviceListing.title}"`,
            booking.id
        );
        // Refresh Customer (other tabs)
        this.refreshOnly(booking.customerId, booking.id);
    }

    @OnEvent('booking.responded', { async: true })
    async handleBookingResponded(booking: Booking) {
        const isAccepted = booking.status === BookingStatus.ACCEPTED;
        // Notify Customer
        await this.notify(
            booking.customerId,
            isAccepted ? NotificationType.BOOKING_ACCEPTED : NotificationType.BOOKING_DECLINED,
            `Your request for "${booking.serviceListing.title}" was ${booking.status}`,
            booking.id
        );
        // Refresh Professional (other tabs)
        this.refreshOnly(booking.serviceListing.professionalId, booking.id);
    }

    @OnEvent('booking.cancelled', { async: true })
    async handleBookingCancelled(payload: { booking: Booking; previousStatus: BookingStatus }) {
        const { booking, previousStatus } = payload;
        
        // Notify Professional if it was already accepted
        if (previousStatus === BookingStatus.ACCEPTED) {
            await this.notify(
                booking.serviceListing.professionalId,
                NotificationType.BOOKING_CANCELLED,
                `Customer cancelled the accepted service: "${booking.serviceListing.title}"`,
                booking.id
            );
        } else {
            // Just refresh professional dashboard to remove pending request
            this.refreshOnly(booking.serviceListing.professionalId, booking.id);
        }

        // Refresh Customer (other tabs)
        this.refreshOnly(booking.customerId, booking.id);
    }

    @OnEvent('booking.completed', { async: true })
    async handleBookingCompleted(booking: Booking) {
        // Notify Customer
        await this.notify(
            booking.customerId,
            NotificationType.BOOKING_ACCEPTED, // Using accepted icon/style as fallback
            `Your service "${booking.serviceListing.title}" has been marked as completed!`,
            booking.id
        );
        // Refresh Professional (other tabs)
        this.refreshOnly(booking.serviceListing.professionalId, booking.id);
    }
}
