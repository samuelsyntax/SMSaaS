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
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(SchoolGuard)
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create a new class' })
    create(
        @Body() dto: CreateClassDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.classesService.create(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get all classes' })
    findAll(
        @Query() pagination: PaginationDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.classesService.findAll(pagination, currentUser);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
    @ApiOperation({ summary: 'Get a class by ID' })
    findOne(
        @Param('id') id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.classesService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update a class' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateClassDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.classesService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete a class' })
    remove(
        @Param('id') id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.classesService.remove(id, currentUser);
    }
}
