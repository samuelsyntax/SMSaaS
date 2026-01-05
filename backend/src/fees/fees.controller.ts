import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto, UpdateFeeStructureDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Fees')
@ApiBearerAuth()
@Controller('fees')
@UseGuards(SchoolGuard)
export class FeesController {
    constructor(private readonly feesService: FeesService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create fee structure' })
    create(@Body() dto: CreateFeeStructureDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.feesService.create(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get all fee structures' })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'academicYearId', required: false })
    findAll(
        @Query() pagination: PaginationDto,
        @Query('classId') classId: string,
        @Query('academicYearId') academicYearId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.feesService.findAll(pagination, currentUser, { classId, academicYearId });
    }

    @Get('class/:classId/year/:academicYearId')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get fees for a specific class and academic year' })
    getFeesForClass(
        @Param('classId') classId: string,
        @Param('academicYearId') academicYearId: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.feesService.getFeesForClass(classId, academicYearId, currentUser);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get fee structure by ID' })
    findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.feesService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update fee structure' })
    update(@Param('id') id: string, @Body() dto: UpdateFeeStructureDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.feesService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete fee structure' })
    remove(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.feesService.remove(id, currentUser);
    }
}
