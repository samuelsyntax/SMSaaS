import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Exams')
@ApiBearerAuth()
@Controller('exams')
@UseGuards(SchoolGuard)
export class ExamsController {
    constructor(private readonly examsService: ExamsService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Create an exam' })
    create(@Body() dto: CreateExamDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.examsService.create(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get all exams' })
    @ApiQuery({ name: 'subjectId', required: false })
    @ApiQuery({ name: 'academicYearId', required: false })
    @ApiQuery({ name: 'type', required: false })
    findAll(
        @Query() pagination: PaginationDto,
        @Query('subjectId') subjectId: string,
        @Query('academicYearId') academicYearId: string,
        @Query('type') type: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.examsService.findAll(pagination, currentUser, { subjectId, academicYearId, type });
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get exam by ID' })
    findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.examsService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Update an exam' })
    update(@Param('id') id: string, @Body() dto: UpdateExamDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.examsService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete an exam' })
    remove(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.examsService.remove(id, currentUser);
    }
}
