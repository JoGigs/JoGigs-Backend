import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking } from '../model/booking/booking.entity';
import { BookingStatus } from '../model/booking/booking-status.enum';

@Injectable()
export class BookingRepository extends Repository<Booking> {
    constructor(private dataSource: DataSource) {
        super(Booking, dataSource.createEntityManager());
    }

    async createBooking(customerId: number, serviceListingId: number): Promise<Booking> {
        const booking = this.create({ customerId, serviceListingId });
        return this.save(booking);
    }

    async findById(id: number): Promise<Booking | null> {
        return this.findOne({
            where: { id },
            relations: ['serviceListing', 'customer'],
        });
    }

    /** All bookings made by a customer */
    async findByCustomer(customerId: number): Promise<Booking[]> {
        return this.find({
            where: { customerId },
            relations: ['serviceListing'],
            order: { createdAt: 'DESC' },
        });
    }

    /** All bookings for services owned by a professional */
    async findByProfessional(professionalId: number): Promise<Booking[]> {
        return this.find({
            where: { serviceListing: { professionalId } },
            relations: ['serviceListing', 'customer'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateStatus(booking: Booking, status: BookingStatus): Promise<Booking> {
        booking.status = status;
        return this.save(booking);
    }
}
