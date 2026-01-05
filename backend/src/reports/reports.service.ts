import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthenticatedUser, Role, PaymentStatus, AttendanceStatus } from '../common/types';
import { AttendanceReportData, GradeReportData, FinancialReportData } from '../common/types';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    // ============================================================================
    // ATTENDANCE REPORTS
    // ============================================================================

    async getAttendanceReport(
        currentUser: AuthenticatedUser,
        filters: { classId?: string; from: string; to: string },
    ): Promise<AttendanceReportData[]> {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const students = await this.prisma.student.findMany({
            where: {
                deletedAt: null,
                ...(schoolId && { schoolId }),
                ...(filters.classId && { currentClassId: filters.classId }),
            },
            include: {
                user: { select: { firstName: true, lastName: true } },
                currentClass: { select: { name: true } },
                attendances: {
                    where: {
                        date: { gte: new Date(filters.from), lte: new Date(filters.to) },
                    },
                },
            },
        });

        return students.map((student) => {
            const totalDays = student.attendances.length;
            const presentDays = student.attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
            const absentDays = student.attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
            const lateDays = student.attendances.filter((a) => a.status === AttendanceStatus.LATE).length;
            const excusedDays = student.attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length;

            return {
                studentId: student.id,
                studentName: `${student.user.firstName} ${student.user.lastName}`,
                className: student.currentClass?.name || 'N/A',
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                excusedDays,
                attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
            };
        });
    }

    async getClassAttendanceSummary(
        classId: string,
        date: string,
        currentUser: AuthenticatedUser,
    ) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const attendances = await this.prisma.attendance.findMany({
            where: {
                classId,
                date: new Date(date),
                ...(schoolId && { student: { schoolId } }),
            },
            include: {
                student: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
        });

        const present = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
        const absent = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
        const late = attendances.filter((a) => a.status === AttendanceStatus.LATE).length;
        const excused = attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length;
        const total = attendances.length;

        return {
            date,
            classId,
            summary: { total, present, absent, late, excused },
            attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
            students: attendances.map((a) => ({
                studentId: a.studentId,
                name: `${a.student.user.firstName} ${a.student.user.lastName}`,
                status: a.status,
                remarks: a.remarks,
            })),
        };
    }

    // ============================================================================
    // GRADE REPORTS
    // ============================================================================

    async getStudentGradeReport(
        studentId: string,
        academicYearId: string,
        currentUser: AuthenticatedUser,
    ): Promise<GradeReportData> {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const student = await this.prisma.student.findFirst({
            where: { id: studentId, ...(schoolId && { schoolId }) },
            include: {
                user: { select: { firstName: true, lastName: true } },
                currentClass: { select: { name: true } },
            },
        });

        if (!student) {
            throw new Error('Student not found');
        }

        const grades = await this.prisma.grade.findMany({
            where: {
                studentId,
                exam: { academicYearId },
                isPublished: true,
            },
            include: {
                exam: { select: { name: true, totalMarks: true, type: true } },
                subject: { select: { id: true, name: true } },
            },
        });

        // Group by subject
        const subjectMap = new Map<string, any>();
        grades.forEach((g) => {
            if (!subjectMap.has(g.subject.id)) {
                subjectMap.set(g.subject.id, {
                    subjectName: g.subject.name,
                    exams: [],
                    total: 0,
                    count: 0,
                });
            }
            const subject = subjectMap.get(g.subject.id);
            const percentage = (Number(g.marksObtained) / g.exam.totalMarks) * 100;
            subject.exams.push({
                examName: g.exam.name,
                marksObtained: Number(g.marksObtained),
                totalMarks: g.exam.totalMarks,
                percentage: Math.round(percentage * 100) / 100,
                grade: g.grade || '',
            });
            subject.total += percentage;
            subject.count++;
        });

        const subjects = Array.from(subjectMap.values()).map((s) => ({
            subjectName: s.subjectName,
            exams: s.exams,
            average: Math.round((s.total / s.count) * 100) / 100,
        }));

        const overallAverage = subjects.length > 0
            ? Math.round((subjects.reduce((sum, s) => sum + s.average, 0) / subjects.length) * 100) / 100
            : 0;

        return {
            studentId: student.id,
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            className: student.currentClass?.name || 'N/A',
            subjects,
            overallAverage,
        };
    }

    async getClassGradeSummary(
        classId: string,
        examId: string,
        currentUser: AuthenticatedUser,
    ) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const grades = await this.prisma.grade.findMany({
            where: {
                examId,
                student: { currentClassId: classId, ...(schoolId && { schoolId }) },
            },
            include: {
                student: { include: { user: { select: { firstName: true, lastName: true } } } },
                exam: { select: { name: true, totalMarks: true, passingMarks: true } },
            },
            orderBy: { marksObtained: 'desc' },
        });

        const total = grades.length;
        const passed = grades.filter((g) => Number(g.marksObtained) >= g.exam.passingMarks).length;
        const failed = total - passed;
        const average = total > 0
            ? grades.reduce((sum, g) => sum + Number(g.marksObtained), 0) / total
            : 0;
        const highest = grades.length > 0 ? Number(grades[0].marksObtained) : 0;
        const lowest = grades.length > 0 ? Number(grades[grades.length - 1].marksObtained) : 0;

        return {
            examId,
            examName: grades[0]?.exam.name || 'N/A',
            classId,
            summary: {
                totalStudents: total,
                passed,
                failed,
                passPercentage: total > 0 ? Math.round((passed / total) * 100) : 0,
                average: Math.round(average * 100) / 100,
                highest,
                lowest,
            },
            students: grades.map((g, index) => ({
                rank: index + 1,
                studentId: g.studentId,
                name: `${g.student.user.firstName} ${g.student.user.lastName}`,
                marksObtained: Number(g.marksObtained),
                grade: g.grade,
            })),
        };
    }

    // ============================================================================
    // FINANCIAL REPORTS
    // ============================================================================

    async getFinancialReport(
        currentUser: AuthenticatedUser,
        filters: { from: string; to: string },
    ): Promise<FinancialReportData> {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const invoices = await this.prisma.invoice.findMany({
            where: {
                deletedAt: null,
                issueDate: { gte: new Date(filters.from), lte: new Date(filters.to) },
                ...(schoolId && { student: { schoolId } }),
            },
            include: {
                items: { include: { feeStructure: { select: { name: true } } } },
            },
        });

        const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        const totalPending = invoices
            .filter((inv) => inv.status === PaymentStatus.PENDING || inv.status === PaymentStatus.PARTIAL)
            .reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
        const totalOverdue = invoices
            .filter((inv) => inv.status !== PaymentStatus.PAID && new Date(inv.dueDate) < new Date())
            .reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);

        // Group by fee type
        const feeTypeMap = new Map<string, { amount: number; collected: number }>();
        invoices.forEach((inv) => {
            inv.items.forEach((item) => {
                const feeType = item.feeStructure?.name || 'Other';
                if (!feeTypeMap.has(feeType)) {
                    feeTypeMap.set(feeType, { amount: 0, collected: 0 });
                }
                const existing = feeTypeMap.get(feeType)!;
                existing.amount += Number(item.amount);
                // Approximate collected per item based on invoice payment ratio
                const paymentRatio = Number(inv.paidAmount) / Number(inv.totalAmount) || 0;
                existing.collected += Number(item.amount) * paymentRatio;
            });
        });

        return {
            period: `${filters.from} to ${filters.to}`,
            totalInvoiced: Math.round(totalInvoiced * 100) / 100,
            totalCollected: Math.round(totalCollected * 100) / 100,
            totalPending: Math.round(totalPending * 100) / 100,
            totalOverdue: Math.round(totalOverdue * 100) / 100,
            collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
            byFeeType: Array.from(feeTypeMap.entries()).map(([feeType, data]) => ({
                feeType,
                amount: Math.round(data.amount * 100) / 100,
                collected: Math.round(data.collected * 100) / 100,
            })),
        };
    }

    async getOutstandingFeesReport(currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const invoices = await this.prisma.invoice.findMany({
            where: {
                deletedAt: null,
                status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
                ...(schoolId && { student: { schoolId } }),
            },
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                        currentClass: { select: { name: true } },
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });

        return invoices.map((inv) => ({
            invoiceNumber: inv.invoiceNumber,
            studentId: inv.studentId,
            studentName: `${inv.student.user.firstName} ${inv.student.user.lastName}`,
            studentEmail: inv.student.user.email,
            className: inv.student.currentClass?.name || 'N/A',
            totalAmount: Number(inv.totalAmount),
            paidAmount: Number(inv.paidAmount),
            balance: Number(inv.balanceAmount),
            dueDate: inv.dueDate,
            daysOverdue: inv.dueDate < new Date() ? Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
            status: inv.status,
        }));
    }

    // ============================================================================
    // DASHBOARD STATS
    // ============================================================================

    async getDashboardStats(currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const [
            totalStudents,
            totalTeachers,
            totalClasses,
            pendingInvoices,
            todayAttendance,
        ] = await Promise.all([
            this.prisma.student.count({ where: { deletedAt: null, ...(schoolId && { schoolId }) } }),
            this.prisma.teacher.count({ where: { deletedAt: null, ...(schoolId && { schoolId }) } }),
            this.prisma.class.count({ where: { deletedAt: null, ...(schoolId && { schoolId }) } }),
            this.prisma.invoice.count({
                where: {
                    deletedAt: null,
                    status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
                    ...(schoolId && { student: { schoolId } }),
                },
            }),
            this.prisma.attendance.count({
                where: {
                    date: new Date(new Date().toISOString().split('T')[0]),
                    status: AttendanceStatus.PRESENT,
                    ...(schoolId && { student: { schoolId } }),
                },
            }),
        ]);

        const totalStudentsToday = schoolId
            ? await this.prisma.student.count({ where: { deletedAt: null, schoolId } })
            : totalStudents;

        return {
            students: totalStudents,
            teachers: totalTeachers,
            classes: totalClasses,
            pendingInvoices,
            todayAttendance: {
                present: todayAttendance,
                total: totalStudentsToday,
                percentage: totalStudentsToday > 0 ? Math.round((todayAttendance / totalStudentsToday) * 100) : 0,
            },
        };
    }
}
