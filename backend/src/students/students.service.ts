import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role } from '../common/types';

@Injectable()
export class StudentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    async create(dto: CreateStudentDto, currentUser: AuthenticatedUser) {
        // Check email uniqueness
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const schoolId = currentUser.role === Role.SUPER_ADMIN
            ? dto.currentClassId
                ? (await this.prisma.class.findUnique({ where: { id: dto.currentClassId } }))?.schoolId
                : null
            : currentUser.schoolId;

        if (!schoolId) {
            throw new ForbiddenException('School ID is required');
        }

        // Generate student ID
        const studentCount = await this.prisma.student.count({
            where: { schoolId },
        });
        const studentId = this.prisma.generatePrefixedId('STU', studentCount + 1);

        // Hash password
        const hashedPassword = await bcrypt.hash(
            dto.password,
            parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
        );

        // Create user and student in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                    role: Role.STUDENT,
                    schoolId,
                },
            });

            const student = await tx.student.create({
                data: {
                    studentId,
                    userId: user.id,
                    schoolId,
                    dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
                    gender: dto.gender,
                    address: dto.address,
                    city: dto.city,
                    state: dto.state,
                    country: dto.country,
                    emergencyContact: dto.emergencyContact,
                    emergencyPhone: dto.emergencyPhone,
                    bloodGroup: dto.bloodGroup,
                    medicalNotes: dto.medicalNotes,
                    currentClassId: dto.currentClassId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                    currentClass: {
                        select: { id: true, name: true, grade: true },
                    },
                },
            });

            return student;
        });

        return result;
    }

    async findAll(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        classId?: string,
    ): Promise<PaginatedResult<any>> {
        const { skip, take, search, sortBy, sortOrder } = pagination;

        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            deletedAt: null,
            ...(schoolId && { schoolId }),
            ...(classId && { currentClassId: classId }),
        };

        if (search) {
            where.OR = [
                { studentId: { contains: search, mode: 'insensitive' } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [students, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take,
                orderBy: sortBy === 'name'
                    ? { user: { firstName: sortOrder } }
                    : { createdAt: sortOrder || 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            isActive: true,
                        },
                    },
                    currentClass: {
                        select: { id: true, name: true, grade: true },
                    },
                },
            }),
            this.prisma.student.count({ where }),
        ]);

        return createPaginatedResult(students, total, pagination.page!, pagination.limit!);
    }

    async findOne(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const student = await this.prisma.student.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(schoolId && { schoolId }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        lastLoginAt: true,
                        createdAt: true,
                    },
                },
                currentClass: {
                    select: { id: true, name: true, grade: true, section: true },
                },
                school: {
                    select: { id: true, name: true },
                },
                enrollments: {
                    include: {
                        class: { select: { id: true, name: true } },
                        academicYear: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        return student;
    }

    async update(id: string, dto: UpdateStudentDto, currentUser: AuthenticatedUser) {
        const student = await this.findOne(id, currentUser);

        // Check email uniqueness if changing
        if (dto.email && dto.email !== student.user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        // Extract user fields
        const userFields: any = {};
        if (dto.email) userFields.email = dto.email;
        if (dto.firstName) userFields.firstName = dto.firstName;
        if (dto.lastName) userFields.lastName = dto.lastName;
        if (dto.phone !== undefined) userFields.phone = dto.phone;
        if (dto.password) {
            userFields.password = await bcrypt.hash(
                dto.password,
                parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
            );
        }

        // Update in transaction
        await this.prisma.$transaction(async (tx) => {
            if (Object.keys(userFields).length > 0) {
                await tx.user.update({
                    where: { id: student.user.id },
                    data: userFields,
                });
            }

            await tx.student.update({
                where: { id },
                data: {
                    dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                    gender: dto.gender,
                    address: dto.address,
                    city: dto.city,
                    state: dto.state,
                    country: dto.country,
                    emergencyContact: dto.emergencyContact,
                    emergencyPhone: dto.emergencyPhone,
                    bloodGroup: dto.bloodGroup,
                    medicalNotes: dto.medicalNotes,
                    currentClassId: dto.currentClassId,
                },
            });
        });

        return this.findOne(id, currentUser);
    }

    async remove(id: string, currentUser: AuthenticatedUser) {
        const student = await this.findOne(id, currentUser);

        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: student.user.id },
                data: { deletedAt: new Date() },
            });
            await tx.student.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        });

        return { message: 'Student deleted successfully' };
    }
}
