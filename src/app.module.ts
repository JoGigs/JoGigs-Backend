import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/user/user.entity';
import { RefreshToken } from './model/auth/refresh-token.entity';
import { AuthController } from './controller/auth/auth.controller';
import { AuthService } from './service/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { UserRepository } from './repository/user.repository';
import { ServiceListing } from './model/service-listing/service-listing.entity';
import { ServiceListingController } from './controller/service-listing/service-listing.controller';
import { ServiceListingRepository } from './repository/service-listing.repository';
import { ServiceListingService } from './service/service-listing/service-listing.service';
import { ProfileController } from './controller/profile/profile.controller';
import { ProfileService } from './service/profile/profile.service';
import { Message } from './model/chat/message.entity';
import { WsModule } from './gateway/ws.module';
import { Booking } from './model/booking/booking.entity';
import { BookingRepository } from './repository/booking.repository';
import { BookingService } from './service/booking/booking.service';
import { BookingController } from './controller/booking/booking.controller';
import { NotificationModule } from './module/notification.module';
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
    WsModule,
    NotificationModule,
  ],
  controllers: [AppController, AuthController, ServiceListingController, ProfileController, BookingController],
  providers: [
    AppService,
    AuthService,
    ServiceListingRepository,
    ServiceListingService,
    ProfileService,
    BookingRepository,
    BookingService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
