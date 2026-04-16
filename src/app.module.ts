import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { MessageRepository } from './repository/message.repository';
import { ChatService } from './service/chat/chat.service';
import { ChatGateway } from './gateway/chat/chat.gateway';
import { Booking } from './model/booking/booking.entity';
import { BookingRepository } from './repository/booking.repository';
import { BookingService } from './service/booking/booking.service';
import { BookingController } from './controller/booking/booking.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5000,
      username: 'postgres',
      password: '123',
      database: 'JoGigs',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: false,
    }),
    TypeOrmModule.forFeature([User, RefreshToken, ServiceListing, Message, Booking]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'SECRET',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AppController, AuthController, ServiceListingController, ProfileController, BookingController],
  providers: [
    AppService,
    AuthService,
    UserRepository,
    ServiceListingRepository,
    ServiceListingService,
    ProfileService,
    MessageRepository,
    ChatService,
    ChatGateway,
    BookingRepository,
    BookingService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
