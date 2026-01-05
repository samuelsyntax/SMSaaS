import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles } from '../common/decorators';
import { Role } from '../common/types';

@ApiTags('Schools')
@ApiBearerAuth()
@Controller('schools')
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new school (SuperAdmin only)' })
    create(@Body() dto: CreateSchoolDto) {
        return this.schoolsService.create(dto);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all schools (SuperAdmin only)' })
    findAll(@Query() pagination: PaginationDto) {
        return this.schoolsService.findAll(pagination);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get a school by ID' })
    findOne(@Param('id') id: string) {
        return this.schoolsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update a school (SuperAdmin only)' })
    update(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
        return this.schoolsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a school (SuperAdmin only)' })
    remove(@Param('id') id: string) {
        return this.schoolsService.remove(id);
    }
}
