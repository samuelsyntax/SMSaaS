import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto, BulkGradeDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Grades')
@ApiBearerAuth()
@Controller('grades')
@UseGuards(SchoolGuard)
export class GradesController {
    constructor(private readonly gradesService: GradesService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Create a grade' })
    create(@Body() dto: CreateGradeDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.gradesService.create(dto, currentUser);
    }

    @Post('bulk')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Create grades in bulk' })
    bulkCreate(@Body() dto: BulkGradeDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.gradesService.bulkCreate(dto, currentUser);
    }

    @Post('publish/:examId')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Publish all grades for an exam' })
    publishGrades(@Param('examId') examId: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.gradesService.publishGrades(examId, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get all grades' })
    @ApiQuery({ name: 'studentId', required: false })
    @ApiQuery({ name: 'examId', required: false })
    @ApiQuery({ name: 'subjectId', required: false })
    findAll(
        @Query() pagination: PaginationDto,
        @Query('studentId') studentId: string,
        @Query('examId') examId: string,
        @Query('subjectId') subjectId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.gradesService.findAll(pagination, currentUser, { studentId, examId, subjectId });
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get grade by ID' })
    findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.gradesService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Update a grade' })
    update(@Param('id') id: string, @Body() dto: UpdateGradeDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.gradesService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete a grade' })
    remove(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.gradesService.remove(id, currentUser);
    }
}
