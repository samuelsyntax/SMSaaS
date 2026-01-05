import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, BulkGradeDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult, calculateGrade } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class GradesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateGradeDto, currentUser: AuthenticatedUser) {
        const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
        if (!exam) throw new NotFoundException('Exam not found');

        const percentage = (dto.marksObtained / exam.totalMarks) * 100;
        const letterGrade = calculateGrade(percentage);

        return this.prisma.grade.upsert({
            where: { studentId_examId: { studentId: dto.studentId, examId: dto.examId } },
            create: {
                studentId: dto.studentId,
                examId: dto.examId,
                subjectId: dto.subjectId,
                marksObtained: new Decimal(dto.marksObtained),
                grade: letterGrade,
                remarks: dto.remarks,
                isPublished: dto.isPublished ?? false,
            },
            update: {
                marksObtained: new Decimal(dto.marksObtained),
                grade: letterGrade,
                remarks: dto.remarks,
                isPublished: dto.isPublished,
            },
            include: {
                student: { include: { user: { select: { firstName: true, lastName: true } } } },
                exam: { select: { id: true, name: true, totalMarks: true, passingMarks: true } },
                subject: { select: { id: true, name: true } },
            },
        });
    }

    async bulkCreate(dto: BulkGradeDto, currentUser: AuthenticatedUser) {
        const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
        if (!exam) throw new NotFoundException('Exam not found');

        const results = await Promise.all(
            dto.grades.map((item) => {
                const percentage = (item.marksObtained / exam.totalMarks) * 100;
                const letterGrade = calculateGrade(percentage);

                return this.prisma.grade.upsert({
                    where: { studentId_examId: { studentId: item.studentId, examId: dto.examId } },
                    create: {
                        studentId: item.studentId,
                        examId: dto.examId,
                        subjectId: dto.subjectId,
                        marksObtained: new Decimal(item.marksObtained),
                        grade: letterGrade,
                        remarks: item.remarks,
                        isPublished: dto.isPublished ?? false,
                    },
                    update: {
                        marksObtained: new Decimal(item.marksObtained),
                        grade: letterGrade,
                        remarks: item.remarks,
                        isPublished: dto.isPublished,
                    },
                });
            }),
        );

        return { count: results.length, message: 'Grades saved successfully' };
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { studentId?: string; examId?: string; subjectId?: string; isPublished?: boolean },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            ...(filters?.studentId && { studentId: filters.studentId }),
            ...(filters?.examId && { examId: filters.examId }),
            ...(filters?.subjectId && { subjectId: filters.subjectId }),
            ...(filters?.isPublished !== undefined && { isPublished: filters.isPublished }),
            ...(schoolId && { student: { schoolId } }),
        };

        // Students/Parents can only see published grades
        if (currentUser.role === Role.STUDENT || currentUser.role === Role.PARENT) {
            where.isPublished = true;
        }

        const [grades, total] = await Promise.all([
            this.prisma.grade.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: sortOrder || 'desc' },
                include: {
                    student: { include: { user: { select: { firstName: true, lastName: true } } } },
                    exam: { select: { id: true, name: true, totalMarks: true, passingMarks: true, type: true } },
                    subject: { select: { id: true, name: true, code: true } },
                },
            }),
            this.prisma.grade.count({ where }),
        ]);

        return createPaginatedResult(grades, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const grade = await this.prisma.grade.findFirst({
            where: { id, ...(schoolId && { student: { schoolId } }) },
            include: {
                student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                exam: { select: { id: true, name: true, totalMarks: true, passingMarks: true, type: true, date: true } },
                subject: { select: { id: true, name: true, code: true } },
            },
        });

        if (!grade) throw new NotFoundException('Grade not found');
        return grade;
    }

    async update(id: string, dto: UpdateGradeDto, currentUser: AuthenticatedUser) {
        const grade = await this.findOne(id, currentUser);

        let letterGrade = grade.grade;
        if (dto.marksObtained !== undefined) {
            const exam = await this.prisma.exam.findUnique({ where: { id: grade.exam.id } });
            if (exam) {
                const percentage = (dto.marksObtained / exam.totalMarks) * 100;
                letterGrade = calculateGrade(percentage);
            }
        }

        return this.prisma.grade.update({
            where: { id },
            data: {
                ...(dto.marksObtained !== undefined && { marksObtained: new Decimal(dto.marksObtained), grade: letterGrade }),
                ...(dto.remarks !== undefined && { remarks: dto.remarks }),
                ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
            },
            include: {
                student: { include: { user: { select: { firstName: true, lastName: true } } } },
                exam: { select: { id: true, name: true, totalMarks: true } },
                subject: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        await this.prisma.grade.delete({ where: { id } });
        return { message: 'Grade deleted successfully' };
    }

    async publishGrades(examId: string, currentUser: AuthenticatedUser) {
        await this.prisma.grade.updateMany({
            where: { examId },
            data: { isPublished: true },
        });
        return { message: 'Grades published successfully' };
    }
}
