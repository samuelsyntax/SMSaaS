import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Enrollment')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(SchoolGuard)
export class EnrollmentController {
    constructor(private readonly enrollmentService: EnrollmentService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create enrollment' })
    create(@Body() dto: CreateEnrollmentDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.enrollmentService.create(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get all enrollments' })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'academicYearId', required: false })
    @ApiQuery({ name: 'studentId', required: false })
    findAll(
        @Query() pagination: PaginationDto,
        @Query('classId') classId: string,
        @Query('academicYearId') academicYearId: string,
        @Query('studentId') studentId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.enrollmentService.findAll(pagination, currentUser, { classId, academicYearId, studentId });
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get enrollment by ID' })
    findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.enrollmentService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update enrollment status' })
    update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.enrollmentService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete enrollment' })
    remove(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.enrollmentService.remove(id, currentUser);
    }
}
