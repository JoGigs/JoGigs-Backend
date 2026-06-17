import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    Req,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookingService } from '../../service/booking/booking.service';
import { CreateBookingDto } from '../../model/booking/dto/create-booking.dto';
import { RespondBookingDto } from '../../model/booking/dto/respond-booking.dto';
import { RateBookingDto } from '../../model/booking/dto/rate-booking.dto';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorator/roles.decorator';
import { Public } from '../../common/decorator/public.decorator';
import { UserType } from '../../model/user/user.type.enum';

@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingController {
    constructor(private readonly bookingService: BookingService) {}

    @Post()
    @Roles(UserType.CUSTOMER)
    createBooking(@Req() req: Request, @Body() dto: CreateBookingDto) {
        const customerId: number = (req as any).user.sub;
        return this.bookingService.createBooking(customerId, dto);
    }

    @Get('my-bookings')
    @Roles(UserType.CUSTOMER)
    getCustomerBookings(@Req() req: Request) {
        const customerId: number = (req as any).user.sub;
        return this.bookingService.getCustomerBookings(customerId);
    }

    @Get('my-jobs')
    @Roles(UserType.PROFESSIONAL)
    getProfessionalBookings(@Req() req: Request) {
        const professionalId: number = (req as any).user.sub;
        return this.bookingService.getProfessionalBookings(professionalId);
    }

    @Patch(':id/respond')
    @Roles(UserType.PROFESSIONAL)
    respondToBooking(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RespondBookingDto,
    ) {
        const professionalId: number = (req as any).user.sub;
        return this.bookingService.respondToBooking(professionalId, id, dto);
    }

    @Patch(':id/complete')
    @Roles(UserType.PROFESSIONAL)
    markBookingCompleted(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const professionalId: number = (req as any).user.sub;
        return this.bookingService.markBookingCompleted(professionalId, id);
    }

    @Patch(':id/cancel')
    @Roles(UserType.CUSTOMER)
    cancelBooking(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const customerId: number = (req as any).user.sub;
        return this.bookingService.cancelBooking(customerId, id);
    }

    @Get('service/:serviceId/comments')
    @Public()
    getServiceComments(
        @Param('serviceId', ParseIntPipe) serviceId: number,
    ) {
        return this.bookingService.getServiceComments(serviceId);
    }

    @Post(':id/rate')
    @Roles(UserType.CUSTOMER)
    rateBooking(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RateBookingDto,
    ) {
        const customerId: number = (req as any).user.sub;
        return this.bookingService.rateBooking(customerId, id, dto);
    }
}
