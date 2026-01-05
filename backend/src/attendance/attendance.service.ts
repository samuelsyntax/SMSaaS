import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class AttendanceService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateAttendanceDto, currentUser: AuthenticatedUser) {
        // Get teacher ID
        const teacher = await this.prisma.teacher.findFirst({
            where: { userId: currentUser.id },
        });

        if (!teacher && currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.SCHOOL_ADMIN) {
            throw new ForbiddenException('Only teachers can mark attendance');
        }

        const markedById = teacher?.id || '';

        // Upsert attendance (update if exists for same student/class/date)
        return this.prisma.attendance.upsert({
            where: {
                studentId_classId_date: {
                    studentId: dto.studentId,
                    classId: dto.classId,
                    date: new Date(dto.date),
                },
            },
            create: {
                studentId: dto.studentId,
                classId: dto.classId,
                date: new Date(dto.date),
                status: dto.status,
                remarks: dto.remarks,
                markedById,
            },
            update: {
                status: dto.status,
                remarks: dto.remarks,
            },
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });
    }

    async bulkCreate(dto: BulkAttendanceDto, currentUser: AuthenticatedUser) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { userId: currentUser.id },
        });

        if (!teacher && currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.SCHOOL_ADMIN) {
            throw new ForbiddenException('Only teachers can mark attendance');
        }

        const markedById = teacher?.id || '';
        const date = new Date(dto.date);

        const results = await Promise.all(
            dto.attendances.map((item) =>
                this.prisma.attendance.upsert({
                    where: {
                        studentId_classId_date: {
                            studentId: item.studentId,
                            classId: dto.classId,
                            date,
                        },
                    },
                    create: {
                        studentId: item.studentId,
                        classId: dto.classId,
                        date,
                        status: item.status,
                        remarks: item.remarks,
                        markedById,
                    },
                    update: {
                        status: item.status,
                        remarks: item.remarks,
                    },
                }),
            ),
        );

        return { count: results.length, message: 'Attendance marked successfully' };
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { classId?: string; studentId?: string; date?: string; from?: string; to?: string },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            ...(filters?.classId && { classId: filters.classId }),
            ...(filters?.studentId && { studentId: filters.studentId }),
            ...(filters?.date && { date: new Date(filters.date) }),
            ...(filters?.from && filters?.to && {
                date: { gte: new Date(filters.from), lte: new Date(filters.to) },
            }),
            ...(schoolId && { student: { schoolId } }),
        };

        const [attendances, total] = await Promise.all([
            this.prisma.attendance.findMany({
                where,
                skip,
                take,
                orderBy: { date: sortOrder || 'desc' },
                include: {
                    student: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                    class: { select: { id: true, name: true } },
                    markedBy: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                },
            }),
            this.prisma.attendance.count({ where }),
        ]);

        return createPaginatedResult(attendances, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const attendance = await this.prisma.attendance.findFirst({
            where: { id, ...(schoolId && { student: { schoolId } }) },
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true, email: true } } },
                },
                class: { select: { id: true, name: true, grade: true } },
                markedBy: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });

        if (!attendance) {
            throw new NotFoundException('Attendance record not found');
        }

        return attendance;
    }

    async update(id: string, dto: UpdateAttendanceDto, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        return this.prisma.attendance.update({
            where: { id },
            data: dto,
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        await this.prisma.attendance.delete({ where: { id } });
        return { message: 'Attendance record deleted successfully' };
    }

    async getClassAttendanceByDate(classId: string, date: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const attendances = await this.prisma.attendance.findMany({
            where: {
                classId,
                date: new Date(date),
                ...(schoolId && { student: { schoolId } }),
            },
            include: {
                student: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
            orderBy: { student: { user: { firstName: 'asc' } } },
        });

        return attendances;
    }
}
