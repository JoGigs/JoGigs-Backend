import { Controller, Post, Body, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ServiceListingService } from '../../service/service-listing/service-listing.service';
import { CreateServiceListingDto } from '../../model/service-listing/dto/create-service.dto';
import { Roles } from '../../common/decorator/roles.decorator';
import { UserType } from '../../model/user/user.type.enum';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Request } from 'express';
import { Public } from '../../common/decorator/public.decorator';

@Controller('services')
@UseGuards(RolesGuard)
export class ServiceListingController {
    constructor(private serviceListingService: ServiceListingService) { }

    @Post()
    @Roles(UserType.PROFESSIONAL)
    create(@Body() dto: CreateServiceListingDto, @Req() req: any) {
        return this.serviceListingService.create(dto, req.user['sub']);
    }

    @Get()
    @Public()
    findAll() {
        return this.serviceListingService.findAll();
    }

    @Get('my')
    @Roles(UserType.PROFESSIONAL)
    findMyServices(@Req() req: any) {
        return this.serviceListingService.findMyServices(req.user['sub']);
    }

    @Delete(':id')
    @Roles(UserType.PROFESSIONAL)
    delete(@Param('id') id: string, @Req() req: any) {
        return this.serviceListingService.delete(+id, req.user['sub']);
    }
}
