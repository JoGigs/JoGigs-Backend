import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateServiceListingDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;
}
