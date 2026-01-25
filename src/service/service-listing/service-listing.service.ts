import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServiceListingRepository } from '../../repository/service-listing.repository';
import { CreateServiceListingDto } from '../../model/service-listing/dto/create-service.dto';
import { User } from '../../model/user/user.entity';
import { UserType } from '../../model/user/user.type.enum';
import { UserRepository } from '../../repository/user.repository';

@Injectable()
export class ServiceListingService {
    constructor(
        private serviceRepository: ServiceListingRepository,
        private userRepository: UserRepository
    ) { }

    async create(dto: CreateServiceListingDto, userId: number) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new NotFoundException('User not found');

        if (user.type !== UserType.PROFESSIONAL) {
            throw new ForbiddenException('Only professionals can create services');
        }
        return this.serviceRepository.createService(dto, user);
    }

    async findAll() {
        return this.serviceRepository.findAllServices();
    }

    async findMyServices(userId: number) {
        return this.serviceRepository.findByProfessional(userId);
    }

    async delete(serviceId: number, userId: number) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
            relations: ['professional']
        });

        if (!service) throw new NotFoundException('Service not found');

        if (service.professional.id !== userId) {
            throw new ForbiddenException('You can only delete your own services');
        }

        return this.serviceRepository.remove(service);
    }
}
