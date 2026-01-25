import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ServiceListing } from '../model/service-listing/service-listing.entity';
import { CreateServiceListingDto } from '../model/service-listing/dto/create-service.dto';
import { User } from '../model/user/user.entity';

@Injectable()
export class ServiceListingRepository extends Repository<ServiceListing> {
    constructor(private dataSource: DataSource) {
        super(ServiceListing, dataSource.createEntityManager());
    }

    async createService(dto: CreateServiceListingDto, professional: User): Promise<ServiceListing> {
        const service = this.create({
            ...dto,
            professional,
        });
        return this.save(service);
    }

    async findByProfessional(professionalId: number): Promise<ServiceListing[]> {
        return this.find({
            where: { professional: { id: professionalId } },
            relations: ['professional'],
        });
    }

    async findAllServices(): Promise<ServiceListing[]> {
        return this.find({
            relations: ['professional'],
            order: { id: 'DESC' }, // Show newest first
        });
    }
}
