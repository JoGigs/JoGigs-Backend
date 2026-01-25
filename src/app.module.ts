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
      dropSchema: true,
    }),
    TypeOrmModule.forFeature([User, RefreshToken, ServiceListing]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'SECRET',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AppController, AuthController, ServiceListingController],
  providers: [
    AppService,
    AuthService,
    UserRepository,
    ServiceListingRepository,
    ServiceListingService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
