import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    async create(dto: CreateUserDto, currentUser?: AuthenticatedUser) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // Non-SUPER_ADMIN can only create users in their own school
        if (currentUser && currentUser.role !== Role.SUPER_ADMIN) {
            if (dto.schoolId && dto.schoolId !== currentUser.schoolId) {
                throw new ForbiddenException('Cannot create users in other schools');
            }
            dto.schoolId = currentUser.schoolId || undefined;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            dto.password,
            parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
        );

        const user = await this.prisma.user.create({
            data: {
                ...dto,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                schoolId: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
    ): Promise<PaginatedResult<any>> {
        const { skip, take, search, sortBy, sortOrder } = pagination;

        // Build where clause based on user role
        const where: any = {
            deletedAt: null,
        };

        // Non-SUPER_ADMIN can only see users in their school
        if (currentUser.role !== Role.SUPER_ADMIN) {
            where.schoolId = currentUser.schoolId;
        }

        // Search
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    avatar: true,
                    schoolId: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    school: {
                        select: { id: true, name: true },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return createPaginatedResult(users, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(currentUser.role !== Role.SUPER_ADMIN && {
                    schoolId: currentUser.schoolId,
                }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                schoolId: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                school: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async update(id: string, dto: UpdateUserDto, currentUser: AuthenticatedUser) {
        const user = await this.findOne(id, currentUser);

        // Check email uniqueness if changing email
        if (dto.email && dto.email !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        // Hash password if provided
        if (dto.password) {
            dto.password = await bcrypt.hash(
                dto.password,
                parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
            );
        }

        // Cannot change school for non-SUPER_ADMIN
        if (currentUser.role !== Role.SUPER_ADMIN) {
            delete dto.schoolId;
        }

        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                schoolId: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);

        // Soft delete
        await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return { message: 'User deleted successfully' };
    }
}
