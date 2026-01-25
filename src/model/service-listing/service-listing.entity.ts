import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class ServiceListing {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column('float', { default: 0 })
    rating: number;

    @ManyToOne(() => User, (user) => user.services, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'professionalId' })
    professional: User;

    @Column()
    professionalId: number;
}
