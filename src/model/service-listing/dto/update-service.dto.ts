import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
 
export class UpdateServiceListingDto {
    @IsOptional()
    @IsString()
    description?: string;
 
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price?: number;
 
    @IsOptional()
    @IsString()
    location?: string;
}
