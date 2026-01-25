import { Injectable, ForbiddenException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { User } from "../../model/user/user.entity";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt';
import { RefreshToken } from "../../model/auth/refresh-token.entity";
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from "../../repository/user.repository";
import { RegisterUserDto } from "../../model/user/dto/register-user.dto";
import { LoginUserDto } from "../../model/user/dto/login-user.dto";

@Injectable()
export class AuthService {
    constructor(
        private userRepository: UserRepository,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private readonly jwtService: JwtService
    ) { }

    async signUp(dto: RegisterUserDto): Promise<User> {
        const exists = await this.userRepository.findByEmail(dto.email);
        if (exists) {
            throw new BadRequestException('User already exists');
        }
        const hashedPassword = await this.hashData(dto.password);
        return this.userRepository.createUser(dto, hashedPassword);
    }

    async signIn(dto: LoginUserDto, response: Response) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) throw new BadRequestException('User does not exist');

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches) throw new ForbiddenException('Access Denied');

        const tokens = await this.getTokens(user.id, user.email, user.type);

        // Session Limit Logic
        await this.manageSessionLimit(user.id);

        await this.storeRefreshToken(user.id, tokens.refreshToken, tokens.jti);

        this.setCookies(response, tokens);
        return { message: 'Success', user };
    }

    private async manageSessionLimit(userId: number) {
        const LIMIT = 5;
        const count = await this.refreshTokenRepository.count({ where: { userId } });

        if (count >= LIMIT) {
            const oldestTokens = await this.refreshTokenRepository.find({
                where: { userId },
                order: { expiresAt: 'ASC' },
                take: count - LIMIT + 1 // Delete enough to make room
            });

            if (oldestTokens.length > 0) {
                await this.refreshTokenRepository.remove(oldestTokens);
            }
        }
    }

    async logout(response: Response, refreshToken?: string) {
        if (refreshToken) {
            try {
                const payload = await this.jwtService.verifyAsync(refreshToken, {
                    secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET'
                });

                if (payload.jti) {
                    await this.refreshTokenRepository.delete({ tokenId: payload.jti });
                }
            } catch (e) {
                // Ignore invalid tokens
            }
        }
        response.clearCookie('access_token');
        response.clearCookie('refresh_token');
        return { message: 'Logged out' };
    }

    async refreshTokens(userId: number, refreshToken: string, response: Response) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET'
            });
            const jti = payload.jti;

            if (!jti) throw new ForbiddenException('Access Denied: No JTI');

            const storedToken = await this.refreshTokenRepository.findOneBy({ tokenId: jti });
            if (!storedToken) throw new ForbiddenException('Access Denied: Token not found');

            const isMatch = await bcrypt.compare(refreshToken, storedToken.hashedToken);
            if (!isMatch) throw new ForbiddenException('Access Denied: Invalid Token');

            await this.refreshTokenRepository.delete({ id: storedToken.id });

            // We need to fetch the user to get their type for the new token
            // storedToken has userId
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) throw new ForbiddenException('User Not Found');

            const tokens = await this.getTokens(userId, user.email, user.type);
            await this.storeRefreshToken(userId, tokens.refreshToken, tokens.jti);

            this.setCookies(response, tokens);
            return { message: 'Tokens refreshed' };

        } catch (e) {
            throw new ForbiddenException('Access Denied');
        }
    }

    private async storeRefreshToken(userId: number, refreshToken: string, jti: string) {
        const hash = await this.hashData(refreshToken);
        const tokenEntity = this.refreshTokenRepository.create({
            userId: userId,
            hashedToken: hash,
            tokenId: jti,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
        await this.refreshTokenRepository.save(tokenEntity);
    }

    private async getTokens(userId: number, email: string, type: string) {
        const jti = uuidv4();
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, email, type },
                { secret: process.env.JWT_SECRET, expiresIn: '15m' },
            ),
            this.jwtService.signAsync(
                { sub: userId, email, jti },
                { secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET', expiresIn: '7d' },
            ),
        ]);

        return { accessToken, refreshToken, jti };
    }

    private async hashData(data: string) {
        return bcrypt.hash(data, 10);
    }

    private setCookies(response: Response, tokens: { accessToken: string, refreshToken: string }) {
        response.cookie('access_token', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });
        response.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}