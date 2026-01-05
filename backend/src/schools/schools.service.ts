import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult } from '../common/types';

@Injectable()
export class SchoolsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateSchoolDto) {
        const existingSchool = await this.prisma.school.findUnique({
            where: { code: dto.code },
        });

        if (existingSchool) {
            throw new ConflictException('School code already exists');
        }

        return this.prisma.school.create({
            data: dto,
        });
    }

    async findAll(pagination: PaginationDto): Promise<PaginatedResult<any>> {
        const { skip, take, search, sortBy, sortOrder } = pagination;

        const where: any = { deletedAt: null };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [schools, total] = await Promise.all([
            this.prisma.school.findMany({
                where,
                skip,
                take,
                orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { users: true, students: true, teachers: true, classes: true },
                    },
                },
            }),
            this.prisma.school.count({ where }),
        ]);

        return createPaginatedResult(schools, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string) {
        const school = await this.prisma.school.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { users: true, students: true, teachers: true, classes: true },
                },
            },
        });

        if (!school) {
            throw new NotFoundException('School not found');
        }

        return school;
    }

    async update(id: string, dto: UpdateSchoolDto) {
        await this.findOne(id);

        if (dto.code) {
            const existingSchool = await this.prisma.school.findFirst({
                where: { code: dto.code, id: { not: id } },
            });
            if (existingSchool) {
                throw new ConflictException('School code already exists');
            }
        }

        return this.prisma.school.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.school.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return { message: 'School deleted successfully' };
    }
}
