import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ProfileService } from '../../service/profile/profile.service';
import { UpdateProfileDto } from '../../model/user/dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    /**
     * GET /profile
     * Returns the authenticated user's basic profile info (no password).
     */
    @Get()
    getProfile(@Req() req: Request) {
        const userId: number = (req as any).user.sub;
        return this.profileService.getProfile(userId);
    }

    /**
     * PATCH /profile
     * Allows the authenticated user to update their name, location, and/or password.
     * Password change requires both `currentPassword` and `newPassword` in the body.
     */
    @Patch()
    updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
        const userId: number = (req as any).user.sub;
        return this.profileService.updateProfile(userId, dto);
    }
}
