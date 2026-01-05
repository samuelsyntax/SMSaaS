import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class ExamsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateExamDto, currentUser: AuthenticatedUser) {
        return this.prisma.exam.create({
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : null,
            },
            include: {
                subject: { select: { id: true, name: true, code: true } },
                academicYear: { select: { id: true, name: true } },
                term: { select: { id: true, name: true } },
            },
        });
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { subjectId?: string; academicYearId?: string; type?: string },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, search, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            deletedAt: null,
            ...(filters?.subjectId && { subjectId: filters.subjectId }),
            ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
            ...(filters?.type && { type: filters.type }),
            ...(schoolId && { subject: { schoolId } }),
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [exams, total] = await Promise.all([
            this.prisma.exam.findMany({
                where,
                skip,
                take,
                orderBy: { date: sortOrder || 'desc' },
                include: {
                    subject: { select: { id: true, name: true, code: true } },
                    academicYear: { select: { id: true, name: true } },
                    term: { select: { id: true, name: true } },
                    _count: { select: { grades: true } },
                },
            }),
            this.prisma.exam.count({ where }),
        ]);

        return createPaginatedResult(exams, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const exam = await this.prisma.exam.findFirst({
            where: { id, deletedAt: null, ...(schoolId && { subject: { schoolId } }) },
            include: {
                subject: { select: { id: true, name: true, code: true } },
                academicYear: { select: { id: true, name: true } },
                term: { select: { id: true, name: true } },
                grades: {
                    include: {
                        student: {
                            include: { user: { select: { firstName: true, lastName: true } } },
                        },
                    },
                },
            },
        });

        if (!exam) throw new NotFoundException('Exam not found');
        return exam;
    }

    async update(id: string, dto: UpdateExamDto, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        return this.prisma.exam.update({
            where: { id },
            data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
            include: {
                subject: { select: { id: true, name: true, code: true } },
                academicYear: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        await this.prisma.exam.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Exam deleted successfully' };
    }
}
