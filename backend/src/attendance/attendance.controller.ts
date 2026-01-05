import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(SchoolGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Mark attendance for a student' })
    create(@Body() dto: CreateAttendanceDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.attendanceService.create(dto, currentUser);
    }

    @Post('bulk')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Mark attendance for multiple students' })
    bulkCreate(@Body() dto: BulkAttendanceDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.attendanceService.bulkCreate(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get attendance records' })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'studentId', required: false })
    @ApiQuery({ name: 'date', required: false })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    findAll(
        @Query() pagination: PaginationDto,
        @Query('classId') classId: string,
        @Query('studentId') studentId: string,
        @Query('date') date: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.attendanceService.findAll(pagination, currentUser, { classId, studentId, date, from, to });
    }

    @Get('class/:classId/date/:date')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get class attendance for a specific date' })
    getClassAttendanceByDate(
        @Param('classId') classId: string,
        @Param('date') date: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.attendanceService.getClassAttendanceByDate(classId, date, currentUser);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get attendance record by ID' })
    findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.attendanceService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Update attendance record' })
    update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.attendanceService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete attendance record' })
    remove(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.attendanceService.remove(id, currentUser);
    }
}
