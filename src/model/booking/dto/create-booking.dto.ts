import { IsNumber, IsPositive } from 'class-validator';

export class CreateBookingDto {
    @IsNumber()
    @IsPositive()
    serviceListingId: number;
}
