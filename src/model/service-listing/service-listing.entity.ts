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

    @Column()
    category: string;

    @Column('float', { default: 0 })
    rating: number;

    @Column({ nullable: true })
    location: string;

    @ManyToOne(() => User, (user) => user.services, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'professionalId' })
    professional: User;

    @Column()
    professionalId: number;

    @Column({ default: false })
    isDisabled: boolean;
}
