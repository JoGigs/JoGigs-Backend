import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity({ name: 'messages' })
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    content: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column()
    senderId: number;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'receiverId' })
    receiver: User;

    @Column()
    receiverId: number;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
