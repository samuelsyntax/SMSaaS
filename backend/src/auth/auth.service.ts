import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto, ChangePasswordDto } from './dto';
import { JwtPayload, TokenResponse, AuthenticatedUser } from '../common/types';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async login(dto: LoginDto): Promise<TokenResponse> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                role: true,
                schoolId: true,
                isActive: true,
                deletedAt: true,
            },
        });

        if (!user || user.deletedAt) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return this.generateTokens(user);
    }

    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        try {
            const payload = this.jwtService.verify<JwtPayload>(refreshToken);

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    schoolId: true,
                    isActive: true,
                    deletedAt: true,
                    refreshToken: true,
                },
            });

            if (!user || !user.isActive || user.deletedAt) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Verify stored refresh token matches
            if (user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            return this.generateTokens(user);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    async changePassword(
        userId: string,
        dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            dto.currentPassword,
            user.password,
        );

        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(
            dto.newPassword,
            parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
        );

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async getProfile(userId: string): Promise<AuthenticatedUser> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                teacherProfile: {
                    include: {
                        teachingAssignments: {
                            include: {
                                subject: true,
                            },
                        },
                        classesAsHomeroom: true,
                    },
                },
                studentProfile: {
                    include: {
                        currentClass: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            ...user,
            role: user.role as AuthenticatedUser['role'],
        };
    }

    private async generateTokens(user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        schoolId: string | null;
    }): Promise<TokenResponse> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role as JwtPayload['role'],
            schoolId: user.schoolId,
        };

        const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '7d';
        const accessToken = this.jwtService.sign(payload, { expiresIn });

        // Refresh token has longer expiry
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

        // Store refresh token
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        // Calculate expiry in seconds
        const expiresInSeconds = this.parseExpiresIn(expiresIn);

        return {
            accessToken,
            refreshToken,
            expiresIn: expiresInSeconds,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role as AuthenticatedUser['role'],
                schoolId: user.schoolId,
            },
        };
    }

    private parseExpiresIn(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 604800; // Default 7 days

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 604800;
        }
    }
}
