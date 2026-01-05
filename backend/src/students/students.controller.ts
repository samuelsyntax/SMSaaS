import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(SchoolGuard)
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create a new student' })
    create(
        @Body() dto: CreateStudentDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.studentsService.create(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get all students' })
    @ApiQuery({ name: 'classId', required: false })
    findAll(
        @Query() pagination: PaginationDto,
        @Query('classId') classId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.studentsService.findAll(pagination, currentUser, classId);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get a student by ID' })
    findOne(
        @Param('id') id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.studentsService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update a student' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateStudentDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.studentsService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete a student' })
    remove(
        @Param('id') id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.studentsService.remove(id, currentUser);
    }
}
