import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class ClassesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateClassDto, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN
            ? null
            : currentUser.schoolId;

        if (!schoolId) {
            throw new ForbiddenException('School ID is required');
        }

        // Check unique name within school
        const existingClass = await this.prisma.class.findFirst({
            where: { schoolId, name: dto.name, deletedAt: null },
        });

        if (existingClass) {
            throw new ConflictException('Class name already exists in this school');
        }

        return this.prisma.class.create({
            data: {
                ...dto,
                schoolId,
            },
            include: {
                homeroomTeacher: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
                _count: {
                    select: { currentStudents: true },
                },
            },
        });
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
                { name: { contains: search, mode: 'insensitive' } },
                { grade: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                skip,
                take,
                orderBy: sortBy ? { [sortBy]: sortOrder } : { grade: 'asc' },
                include: {
                    homeroomTeacher: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true },
                            },
                        },
                    },
                    _count: {
                        select: { currentStudents: true, enrollments: true },
                    },
                },
            }),
            this.prisma.class.count({ where }),
        ]);

        return createPaginatedResult(classes, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const classEntity = await this.prisma.class.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(schoolId && { schoolId }),
            },
            include: {
                homeroomTeacher: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
                school: {
                    select: { id: true, name: true },
                },
                classSubjects: {
                    include: {
                        subject: { select: { id: true, name: true, code: true } },
                    },
                },
                _count: {
                    select: { currentStudents: true, enrollments: true },
                },
            },
        });

        if (!classEntity) {
            throw new NotFoundException('Class not found');
        }

        return classEntity;
    }

    async update(id: string, dto: UpdateClassDto, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;
        await this.findOne(id, currentUser);

        if (dto.name) {
            const existingClass = await this.prisma.class.findFirst({
                where: {
                    name: dto.name,
                    id: { not: id },
                    deletedAt: null,
                    ...(schoolId && { schoolId }),
                },
            });
            if (existingClass) {
                throw new ConflictException('Class name already exists');
            }
        }

        return this.prisma.class.update({
            where: { id },
            data: dto,
            include: {
                homeroomTeacher: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
                _count: {
                    select: { currentStudents: true },
                },
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);

        await this.prisma.class.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return { message: 'Class deleted successfully' };
    }
}
