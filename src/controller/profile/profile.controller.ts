import { Controller, Get, Patch, Body, Req, Param, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { ProfileService } from '../../service/profile/profile.service';
import { UpdateProfileDto } from '../../model/user/dto/update-profile.dto';
import { Public } from '../../common/decorator/public.decorator';
 
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}
 
    @Get(':id/rating')
    @Public()
    getProfessionalRating(@Param('id', ParseIntPipe) id: number) {
        return this.profileService.getProfessionalRating(id);
    }

    @Get()
    getProfile(@Req() req: Request) {
        const userId: number = (req as any).user.sub;
        return this.profileService.getProfile(userId);
    }

    @Patch()
    updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
        const userId: number = (req as any).user.sub;
        return this.profileService.updateProfile(userId, dto);
    }
}
