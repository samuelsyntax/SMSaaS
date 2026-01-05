import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class EnrollmentService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateEnrollmentDto, currentUser: AuthenticatedUser) {
        // Check if enrollment already exists
        const existing = await this.prisma.enrollment.findFirst({
            where: {
                studentId: dto.studentId,
                classId: dto.classId,
                academicYearId: dto.academicYearId,
                deletedAt: null,
            },
        });

        if (existing) {
            throw new ConflictException('Student is already enrolled in this class for this academic year');
        }

        const enrollment = await this.prisma.enrollment.create({
            data: dto,
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                class: { select: { id: true, name: true, grade: true } },
                academicYear: { select: { id: true, name: true } },
            },
        });

        // Update student's current class
        await this.prisma.student.update({
            where: { id: dto.studentId },
            data: { currentClassId: dto.classId },
        });

        return enrollment;
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { classId?: string; academicYearId?: string; studentId?: string },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            deletedAt: null,
            ...(filters?.classId && { classId: filters.classId }),
            ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
            ...(filters?.studentId && { studentId: filters.studentId }),
            ...(schoolId && { student: { schoolId } }),
        };

        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                skip,
                take,
                orderBy: { enrollmentDate: sortOrder || 'desc' },
                include: {
                    student: {
                        include: { user: { select: { firstName: true, lastName: true, email: true } } },
                    },
                    class: { select: { id: true, name: true, grade: true } },
                    academicYear: { select: { id: true, name: true } },
                },
            }),
            this.prisma.enrollment.count({ where }),
        ]);

        return createPaginatedResult(enrollments, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const enrollment = await this.prisma.enrollment.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(schoolId && { student: { schoolId } }),
            },
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true, email: true } } },
                },
                class: { select: { id: true, name: true, grade: true, section: true } },
                academicYear: { select: { id: true, name: true, startDate: true, endDate: true } },
            },
        });

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        return enrollment;
    }

    async update(id: string, dto: UpdateEnrollmentDto, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        return this.prisma.enrollment.update({
            where: { id },
            data: dto,
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                class: { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        await this.prisma.enrollment.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Enrollment deleted successfully' };
    }
}
