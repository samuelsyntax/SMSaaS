import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TeachersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    async create(dto: CreateTeacherDto, currentUser: AuthenticatedUser) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const schoolId = currentUser.role === Role.SUPER_ADMIN
            ? null
            : currentUser.schoolId;

        if (!schoolId && currentUser.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('School ID is required');
        }

        if (!schoolId) {
            throw new ForbiddenException('School ID is required for teacher creation');
        }

        const teacherCount = await this.prisma.teacher.count({ where: { schoolId } });
        const employeeId = this.prisma.generatePrefixedId('TCH', teacherCount + 1);

        const hashedPassword = await bcrypt.hash(
            dto.password,
            parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
        );

        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                    role: Role.TEACHER,
                    schoolId,
                },
            });

            const teacher = await tx.teacher.create({
                data: {
                    employeeId,
                    userId: user.id,
                    schoolId,
                    dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
                    gender: dto.gender,
                    address: dto.address,
                    city: dto.city,
                    state: dto.state,
                    country: dto.country,
                    qualification: dto.qualification,
                    specialization: dto.specialization,
                    salary: dto.salary ? new Decimal(dto.salary) : null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                },
            });

            return teacher;
        });

        return result;
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
    ): Promise<PaginatedResult<any>> {
        const { skip, take, search, sortBy, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            deletedAt: null,
            ...(schoolId && { schoolId }),
        };

        if (search) {
            where.OR = [
                { employeeId: { contains: search, mode: 'insensitive' } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [teachers, total] = await Promise.all([
            this.prisma.teacher.findMany({
                where,
                skip,
                take,
                orderBy: sortBy === 'name'
                    ? { user: { firstName: sortOrder } }
                    : { createdAt: sortOrder || 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                    classesAsHomeroom: {
                        select: { id: true, name: true },
                    },
                },
            }),
            this.prisma.teacher.count({ where }),
        ]);

        return createPaginatedResult(teachers, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const teacher = await this.prisma.teacher.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(schoolId && { schoolId }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        lastLoginAt: true,
                        createdAt: true,
                    },
                },
                school: {
                    select: { id: true, name: true },
                },
                classesAsHomeroom: {
                    select: { id: true, name: true, grade: true },
                },
                teachingAssignments: {
                    include: {
                        subject: { select: { id: true, name: true, code: true } },
                    },
                },
            },
        });

        if (!teacher) {
            throw new NotFoundException('Teacher not found');
        }

        return teacher;
    }

    async update(id: string, dto: UpdateTeacherDto, currentUser: AuthenticatedUser) {
        const teacher = await this.findOne(id, currentUser);

        if (dto.email && dto.email !== teacher.user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        const userFields: any = {};
        if (dto.email) userFields.email = dto.email;
        if (dto.firstName) userFields.firstName = dto.firstName;
        if (dto.lastName) userFields.lastName = dto.lastName;
        if (dto.phone !== undefined) userFields.phone = dto.phone;
        if (dto.password) {
            userFields.password = await bcrypt.hash(
                dto.password,
                parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
            );
        }

        await this.prisma.$transaction(async (tx) => {
            if (Object.keys(userFields).length > 0) {
                await tx.user.update({
                    where: { id: teacher.user.id },
                    data: userFields,
                });
            }

            await tx.teacher.update({
                where: { id },
                data: {
                    dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                    gender: dto.gender,
                    address: dto.address,
                    city: dto.city,
                    state: dto.state,
                    country: dto.country,
                    qualification: dto.qualification,
                    specialization: dto.specialization,
                    salary: dto.salary !== undefined ? new Decimal(dto.salary) : undefined,
                },
            });
        });

        return this.findOne(id, currentUser);
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        const teacher = await this.findOne(id, currentUser);

        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: teacher.user.id },
                data: { deletedAt: new Date() },
            });
            await tx.teacher.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        });

        return { message: 'Teacher deleted successfully' };
    }
}
