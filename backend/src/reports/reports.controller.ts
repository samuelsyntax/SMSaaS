import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(SchoolGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    // ============================================================================
    // DASHBOARD
    // ============================================================================

    @Get('dashboard')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getDashboardStats(@CurrentUser() currentUser: AuthenticatedUser) {
        try {
            return this.reportsService.getDashboardStats(currentUser);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    // ============================================================================
    // ATTENDANCE REPORTS
    // ============================================================================

    @Get('attendance')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get attendance report' })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'from', required: true })
    @ApiQuery({ name: 'to', required: true })
    getAttendanceReport(
        @Query('classId') classId: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.reportsService.getAttendanceReport(currentUser, { classId, from, to });
    }

    @Get('attendance/class/:classId/date/:date')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get class attendance summary for a date' })
    getClassAttendanceSummary(
        @Param('classId') classId: string,
        @Param('date') date: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.reportsService.getClassAttendanceSummary(classId, date, currentUser);
    }

    // ============================================================================
    // GRADE REPORTS
    // ============================================================================

    @Get('grades/student/:studentId')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get student grade report' })
    @ApiQuery({ name: 'academicYearId', required: true })
    getStudentGradeReport(
        @Param('studentId') studentId: string,
        @Query('academicYearId') academicYearId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.reportsService.getStudentGradeReport(studentId, academicYearId, currentUser);
    }

    @Get('grades/class/:classId/exam/:examId')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get class grade summary for an exam' })
    getClassGradeSummary(
        @Param('classId') classId: string,
        @Param('examId') examId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.reportsService.getClassGradeSummary(classId, examId, currentUser);
    }

    // ============================================================================
    // FINANCIAL REPORTS
    // ============================================================================

    @Get('financial')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get financial report' })
    @ApiQuery({ name: 'from', required: true })
    @ApiQuery({ name: 'to', required: true })
    getFinancialReport(
        @Query('from') from: string,
        @Query('to') to: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.reportsService.getFinancialReport(currentUser, { from, to });
    }

    @Get('financial/outstanding')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get outstanding fees report' })
    getOutstandingFeesReport(@CurrentUser() currentUser: AuthenticatedUser) {
        return this.reportsService.getOutstandingFeesReport(currentUser);
    }
}
