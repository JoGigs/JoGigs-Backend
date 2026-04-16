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
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorator/roles.decorator';
import { UserType } from '../../model/user/user.type.enum';

@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingController {
    constructor(private readonly bookingService: BookingService) {}

    /**
     * POST /bookings
     * Customer requests a booking for a specific service
     */
    @Post()
    @Roles(UserType.CUSTOMER)
    createBooking(@Req() req: Request, @Body() dto: CreateBookingDto) {
        const customerId: number = (req as any).user.sub;
        return this.bookingService.createBooking(customerId, dto);
    }

    /**
     * GET /bookings/my-bookings
     * Customer retrieves all their own requests
     */
    @Get('my-bookings')
    @Roles(UserType.CUSTOMER)
    getCustomerBookings(@Req() req: Request) {
        const customerId: number = (req as any).user.sub;
        return this.bookingService.getCustomerBookings(customerId);
    }

    /**
     * GET /bookings/my-jobs
     * Professional retrieves all booking requests assigned to their services
     */
    @Get('my-jobs')
    @Roles(UserType.PROFESSIONAL)
    getProfessionalBookings(@Req() req: Request) {
        const professionalId: number = (req as any).user.sub;
        return this.bookingService.getProfessionalBookings(professionalId);
    }

    /**
     * PATCH /bookings/:id/respond
     * Professional accepts or declines a pending booking request
     */
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

    /**
     * PATCH /bookings/:id/complete
     * Professional marks an accepted booking as completed so they can be rated
     */
    @Patch(':id/complete')
    @Roles(UserType.PROFESSIONAL)
    markBookingCompleted(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const professionalId: number = (req as any).user.sub;
        return this.bookingService.markBookingCompleted(professionalId, id);
    }
}
