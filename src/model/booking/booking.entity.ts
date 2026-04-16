import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ServiceListing } from '../service-listing/service-listing.entity';
import { BookingStatus } from './booking-status.enum';

@Entity({ name: 'bookings' })
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customerId' })
    customer: User;

    @Column()
    customerId: number;

    @ManyToOne(() => ServiceListing, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'serviceListingId' })
    serviceListing: ServiceListing;

    @Column()
    serviceListingId: number;

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
    status: BookingStatus;

    @Column({ type: 'float', nullable: true })
    customerRating: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
