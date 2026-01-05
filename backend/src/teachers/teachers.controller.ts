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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller('teachers')
@UseGuards(SchoolGuard)
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create a new teacher' })
    create(
        @Body() dto: CreateTeacherDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.teachersService.create(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get all teachers' })
    findAll(
        @Query() pagination: PaginationDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.teachersService.findAll(pagination, currentUser);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get a teacher by ID' })
    findOne(
        @Param('id') id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.teachersService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update a teacher' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateTeacherDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.teachersService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete a teacher' })
    remove(
        @Param('id') id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.teachersService.remove(id, currentUser);
    }
}
