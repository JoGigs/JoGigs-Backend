import { Controller, Post, Body, Res, Get, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../service/auth/auth.service';
import type { Response, Request } from 'express';
import { Public } from '../../common/decorator/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../../model/user/dto/register-user.dto';
import { LoginUserDto } from '../../model/user/dto/login-user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService
    ) { }

    @Public()
    @Post('signup')
    signup(@Body() dto: RegisterUserDto) {
        return this.authService.signUp(dto);
    }

    @Public()
    @Post('signin')
    signin(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.signIn(dto, res);
    }

    @Get('logout')
    logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        return this.authService.logout(res, refreshToken);
    }

    @Public()
    @Get('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) throw new ForbiddenException('Access Denied: No refresh token');

        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET'
            });
        } catch (e) {
            throw new ForbiddenException('Access Denied: Invalid token');
        }

        return this.authService.refreshTokens(payload.sub, refreshToken, res);
    }
}
