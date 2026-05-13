import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { NotificationType } from './notification-type.enum';

@Entity({ name: 'notifications' })
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;

    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @Column()
    message: string;

    @Column({ nullable: true })
    relatedId: number; // e.g., Booking ID or Service ID

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
