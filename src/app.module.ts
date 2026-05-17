import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controller/auth/auth.controller';
import { ServiceListingController } from './controller/service-listing/service-listing.controller';
import { ProfileController } from './controller/profile/profile.controller';
import { BookingController } from './controller/booking/booking.controller';
import { NotificationController } from './controller/notification/notification.controller';
import { AuthService } from './service/auth/auth.service';
import { ServiceListingService } from './service/service-listing/service-listing.service';
import { ProfileService } from './service/profile/profile.service';
import { BookingService } from './service/booking/booking.service';
import { ChatService } from './service/chat/chat.service';
import { NotificationService } from './service/notification/notification.service';
import { UserRepository } from './repository/user.repository';
import { ServiceListingRepository } from './repository/service-listing.repository';
import { BookingRepository } from './repository/booking.repository';
import { MessageRepository } from './repository/message.repository';
import { NotificationRepository } from './repository/notification.repository';
import { WsGateway } from './gateway/ws.gateway';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { User } from './model/user/user.entity';
import { RefreshToken } from './model/auth/refresh-token.entity';
import { ServiceListing } from './model/service-listing/service-listing.entity';
import { Message } from './model/chat/message.entity';
import { Booking } from './model/booking/booking.entity';
import { Notification } from './model/notification/notification.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5000'),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '123',
            database: process.env.DB_NAME || 'JoGigs',
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV !== 'production',
            dropSchema: false,
        }),
        TypeOrmModule.forFeature([User, RefreshToken, ServiceListing, Message, Booking, Notification]),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'SECRET',
            signOptions: { expiresIn: '15m' },
        }),
    ],
    controllers: [
        AuthController,
        ServiceListingController,
        ProfileController,
        BookingController,
        NotificationController,
    ],
    providers: [
        AuthService,
        ServiceListingService,
        ProfileService,
        BookingService,
        ChatService,
        NotificationService,
        UserRepository,
        ServiceListingRepository,
        BookingRepository,
        MessageRepository,
        NotificationRepository,
        WsGateway,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
