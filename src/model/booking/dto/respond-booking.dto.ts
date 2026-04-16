import { IsEnum } from 'class-validator';
import { BookingStatus } from '../booking-status.enum';

// The professional can only accept or decline — not jump to COMPLETED via this endpoint
const AllowedResponses = [BookingStatus.ACCEPTED, BookingStatus.DECLINED] as const;

export class RespondBookingDto {
    @IsEnum(AllowedResponses, {
        message: `status must be one of: ${AllowedResponses.join(', ')}`,
    })
    status: BookingStatus.ACCEPTED | BookingStatus.DECLINED;
}
