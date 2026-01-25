import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserType } from '../user.type.enum';

export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEnum(UserType)
    accountType: UserType;
}
