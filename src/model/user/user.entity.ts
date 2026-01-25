import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { UserType } from './user.type.enum';
import { RefreshToken } from '../auth/refresh-token.entity';
import { ServiceListing } from '../service-listing/service-listing.entity';

@Entity({ name: 'user_gigs' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    @IsEmail()
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column()
    fullName: string;

    @Column()
    phone: string;

    @Column()
    type: UserType;

    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens: RefreshToken[];

    @OneToMany(() => ServiceListing, (service) => service.professional)
    services: ServiceListing[];
}