import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import { BookingRepository } from '../../repository/booking.repository';
import { ServiceListingRepository } from '../../repository/service-listing.repository';
import { Booking } from '../../model/booking/booking.entity';
import { BookingStatus } from '../../model/booking/booking-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateBookingDto } from '../../model/booking/dto/create-booking.dto';
import { RespondBookingDto } from '../../model/booking/dto/respond-booking.dto';
import { RateBookingDto } from '../../model/booking/dto/rate-booking.dto';

@Injectable()
export class BookingService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly serviceListingRepository: ServiceListingRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async createBooking(customerId: number, dto: CreateBookingDto): Promise<Booking> {
        const serviceListing = await this.serviceListingRepository.findOneBy({
            id: dto.serviceListingId,
        });

        if (!serviceListing) {
            throw new NotFoundException(`Service listing with ID ${dto.serviceListingId} not found`);
        }

        if (serviceListing.isDisabled) {
            throw new BadRequestException('This service is currently disabled and cannot be booked');
        }

        if (serviceListing.professionalId === customerId) {
            throw new BadRequestException('You cannot book your own service');
        }

        const existingBooking = await this.bookingRepository.findOneBy({
            customerId,
            serviceListingId: dto.serviceListingId,
            status: BookingStatus.PENDING,
        });

        if (existingBooking) {
            throw new BadRequestException('You already have a booking for this service');
        }

        const booking = await this.bookingRepository.createBooking(customerId, dto.serviceListingId);

        // Fetch with relations so the listeners have the data they need
        const hydrated = await this.bookingRepository.findById(booking.id);
        
        if (!hydrated) {
            throw new Error('Failed to load created booking');
        }

        this.eventEmitter.emit('booking.created', hydrated);

        return hydrated;
    }

    async getCustomerBookings(customerId: number): Promise<Booking[]> {
        return this.bookingRepository.findByCustomer(customerId);
    }

    async getProfessionalBookings(professionalId: number): Promise<Booking[]> {
        return this.bookingRepository.findByProfessional(professionalId);
    }

    async respondToBooking(
        professionalId: number,
        bookingId: number,
        dto: RespondBookingDto,
    ): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${bookingId} not found`);
        }

        if (booking.serviceListing.professionalId !== professionalId) {
            throw new ForbiddenException('You do not have permission to respond to this booking');
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new BadRequestException(`Booking is already ${booking.status}`);
        }

        const saved = await this.bookingRepository.updateStatus(booking, dto.status);

        const isAccepted = dto.status === BookingStatus.ACCEPTED;
        this.eventEmitter.emit('booking.responded', saved);

        return saved;
    }

    async markBookingCompleted(professionalId: number, bookingId: number): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${bookingId} not found`);
        }

        if (booking.serviceListing.professionalId !== professionalId) {
            throw new ForbiddenException('You do not have permission to modify this booking');
        }

        if (booking.status !== BookingStatus.ACCEPTED) {
            throw new BadRequestException(
                `Only ACCEPTED bookings can be marked as COMPLETED. Current status: ${booking.status}`,
            );
        }

        const saved = await this.bookingRepository.updateStatus(booking, BookingStatus.COMPLETED);
        this.eventEmitter.emit('booking.completed', saved);
        return saved;
    }

    async cancelBooking(customerId: number, bookingId: number): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${bookingId} not found`);
        }

        if (booking.customerId !== customerId) {
            throw new ForbiddenException('You can only cancel your own bookings');
        }

        if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.ACCEPTED) {
            throw new BadRequestException(
                `Only PENDING or ACCEPTED bookings can be cancelled. Current status: ${booking.status}`,
            );
        }

        const previousStatus = booking.status;
        const saved = await this.bookingRepository.updateStatus(booking, BookingStatus.CANCELLED);

        this.eventEmitter.emit('booking.cancelled', { booking: saved, previousStatus });

        return saved;
    }

    async rateBooking(customerId: number, bookingId: number, dto: RateBookingDto): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${bookingId} not found`);
        }

        if (booking.customerId !== customerId) {
            throw new ForbiddenException('You can only rate your own bookings');
        }

        if (booking.status !== BookingStatus.COMPLETED) {
            throw new BadRequestException(
                `Only COMPLETED bookings can be rated. Current status: ${booking.status}`,
            );
        }

        if (booking.customerRating !== null) {
            throw new BadRequestException('You have already rated this booking');
        }

        booking.customerRating = dto.rating;
        if (dto.comment) {
            booking.comment = dto.comment;
        }
        const saved = await this.bookingRepository.save(booking);

        // Recalculate average rating for the service listing
        const avgResult = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('AVG(booking.customerRating)', 'avg')
            .where('booking.serviceListingId = :id', { id: booking.serviceListingId })
            .andWhere('booking.customerRating IS NOT NULL')
            .getRawOne();

        const newAvg = avgResult?.avg ? parseFloat(avgResult.avg) : 0;
        await this.serviceListingRepository.update(booking.serviceListingId, { rating: newAvg });

        return saved;
    }

    async getServiceComments(serviceId: number): Promise<Booking[]> {
        return this.bookingRepository.find({
            where: {
                serviceListingId: serviceId,
                customerRating: Not(IsNull()),
            },
            relations: ['customer'],
            order: { createdAt: 'DESC' },
        });
    }
}
