import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    currentPassword?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    newPassword?: string;
}
