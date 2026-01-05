import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFeeStructureDto, UpdateFeeStructureDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FeesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateFeeStructureDto, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? null : currentUser.schoolId;
        if (!schoolId) throw new ForbiddenException('School ID is required');

        return this.prisma.feeStructure.create({
            data: {
                ...dto,
                amount: new Decimal(dto.amount),
                schoolId,
            },
            include: {
                class: { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
            },
        });
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { classId?: string; academicYearId?: string },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, search, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            deletedAt: null,
            ...(schoolId && { schoolId }),
            ...(filters?.classId && { classId: filters.classId }),
            ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
        };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const [fees, total] = await Promise.all([
            this.prisma.feeStructure.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: sortOrder || 'desc' },
                include: {
                    class: { select: { id: true, name: true } },
                    academicYear: { select: { id: true, name: true } },
                },
            }),
            this.prisma.feeStructure.count({ where }),
        ]);

        return createPaginatedResult(fees, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const fee = await this.prisma.feeStructure.findFirst({
            where: { id, deletedAt: null, ...(schoolId && { schoolId }) },
            include: {
                class: { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
                school: { select: { id: true, name: true } },
            },
        });

        if (!fee) throw new NotFoundException('Fee structure not found');
        return fee;
    }

    async update(id: string, dto: UpdateFeeStructureDto, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        return this.prisma.feeStructure.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.amount !== undefined && { amount: new Decimal(dto.amount) }),
            },
            include: {
                class: { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        await this.findOne(id, currentUser);
        await this.prisma.feeStructure.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Fee structure deleted successfully' };
    }

    async getFeesForClass(classId: string, academicYearId: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        return this.prisma.feeStructure.findMany({
            where: {
                deletedAt: null,
                academicYearId,
                OR: [
                    { classId },
                    { classId: null }, // School-wide fees
                ],
                ...(schoolId && { schoolId }),
            },
            orderBy: { name: 'asc' },
        });
    }
}
