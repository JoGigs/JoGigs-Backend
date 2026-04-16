import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../model/user/user.entity';
import { RegisterUserDto } from '../model/user/dto/register-user.dto';

@Injectable()
export class UserRepository extends Repository<User> {
    constructor(private dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.findOneBy({ email });
    }

    async findById(id: number): Promise<User | null> {
        return this.findOneBy({ id });
    }

    async createUser(dto: RegisterUserDto, hashedPassword: string): Promise<User> {
        const newUser = this.create({
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            password: hashedPassword,
            type: dto.accountType,
        });
        return this.save(newUser);
    }

    async updateProfile(
        user: User,
        fields: { fullName?: string; location?: string; password?: string },
    ): Promise<User> {
        if (fields.fullName !== undefined) user.fullName = fields.fullName;
        if (fields.location !== undefined) user.location = fields.location;
        if (fields.password !== undefined) user.password = fields.password;
        return this.save(user);
    }
}

