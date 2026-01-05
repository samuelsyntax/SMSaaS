import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class SubjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateSubjectDto, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN
            ? null
            : currentUser.schoolId;

        if (!schoolId) {
            throw new ForbiddenException('School ID is required');
        }

        const existingSubject = await this.prisma.subject.findFirst({
            where: { schoolId, code: dto.code, deletedAt: null },
        });

        if (existingSubject) {
            throw new ConflictException('Subject code already exists');
        }

        return this.prisma.subject.create({
            data: { ...dto, schoolId },
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
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [subjects, total] = await Promise.all([
            this.prisma.subject.findMany({
                where,
                skip,
                take,
                orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
            }),
            this.prisma.subject.count({ where }),
        ]);

        return createPaginatedResult(subjects, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const subject = await this.prisma.subject.findFirst({
            where: { id, deletedAt: null, ...(schoolId && { schoolId }) },
            include: {
                classSubjects: {
                    include: { class: { select: { id: true, name: true } } },
                },
                teacherSubjects: {
                    include: {
                        teacher: {
                            include: { user: { select: { firstName: true, lastName: true } } },
                        },
                    },
                },
            },
        });

        if (!subject) {
            throw new NotFoundException('Subject not found');
        }

        return subject;
    }

    async update(id: string, dto: UpdateSubjectDto, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;
        await this.findOne(id, currentUser);

        if (dto.code) {
            const existing = await this.prisma.subject.findFirst({
                where: { code: dto.code, id: { not: id }, deletedAt: null, ...(schoolId && { schoolId }) },
            });
            if (existing) throw new ConflictException('Subject code already exists');
        }

        return this.prisma.subject.update({ where: { id }, data: dto });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        await this.prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Subject deleted successfully' };
    }
}
