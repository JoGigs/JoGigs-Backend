import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { BookingRepository } from '../../repository/booking.repository';
import { ServiceListingRepository } from '../../repository/service-listing.repository';
import { Booking } from '../../model/booking/booking.entity';
import { BookingStatus } from '../../model/booking/booking-status.enum';
import { CreateBookingDto } from '../../model/booking/dto/create-booking.dto';
import { RespondBookingDto } from '../../model/booking/dto/respond-booking.dto';

@Injectable()
export class BookingService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly serviceListingRepository: ServiceListingRepository,
    ) {}

    async createBooking(customerId: number, dto: CreateBookingDto): Promise<Booking> {
        const serviceListing = await this.serviceListingRepository.findOneBy({
            id: dto.serviceListingId,
        });

        if (!serviceListing) {
            throw new NotFoundException(`Service listing with ID ${dto.serviceListingId} not found`);
        }

        // Optional: Prevent a professional from booking their own service
        if (serviceListing.professionalId === customerId) {
            throw new BadRequestException('You cannot book your own service');
        }

        return this.bookingRepository.createBooking(customerId, dto.serviceListingId);
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

        // Ensure the current user is the owner of the service listing being booked
        if (booking.serviceListing.professionalId !== professionalId) {
            throw new ForbiddenException('You do not have permission to respond to this booking');
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new BadRequestException(`Booking is already ${booking.status}`);
        }

        return this.bookingRepository.updateStatus(booking, dto.status);
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

        return this.bookingRepository.updateStatus(booking, BookingStatus.COMPLETED);
    }
}
