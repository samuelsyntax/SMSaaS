import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    MinLength,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Role } from '../../common/types';

export class CreateUserDto {
    @ApiProperty({ example: 'john.doe@school.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ enum: Role })
    @IsEnum(Role)
    role: Role;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    schoolId?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
    // Password is optional in update
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
}

export class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    phone: string | null;
    avatar: string | null;
    schoolId: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
