import {
    Injectable,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../repository/user.repository';
import { UpdateProfileDto } from '../../model/user/dto/update-profile.dto';
import { User } from '../../model/user/user.entity';

@Injectable()
export class ProfileService {
    constructor(private readonly userRepository: UserRepository) {}

    async getProfile(userId: number): Promise<Omit<User, 'password'>> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        // Strip password before returning
        const { password, ...profile } = user;
        return profile as Omit<User, 'password'>;
    }

    async updateProfile(userId: number, dto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const updates: { fullName?: string; location?: string; password?: string } = {};

        if (dto.fullName !== undefined) {
            updates.fullName = dto.fullName;
        }

        if (dto.location !== undefined) {
            updates.location = dto.location;
        }

        // Password change requires both currentPassword and newPassword
        if (dto.newPassword !== undefined || dto.currentPassword !== undefined) {
            if (!dto.currentPassword || !dto.newPassword) {
                throw new BadRequestException(
                    'Both currentPassword and newPassword are required to change your password',
                );
            }

            const passwordMatches = await bcrypt.compare(dto.currentPassword, user.password);
            if (!passwordMatches) {
                throw new UnauthorizedException('Current password is incorrect');
            }

            updates.password = await bcrypt.hash(dto.newPassword, 10);
        }

        const updated = await this.userRepository.updateProfile(user, updates);

        const { password, ...profile } = updated;
        return profile as Omit<User, 'password'>;
    }
}
