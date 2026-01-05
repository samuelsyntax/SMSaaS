import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsEmail,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '../../common/types';

export class CreateStudentDto {
    // User fields
    @ApiProperty({ example: 'student@school.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    // Student-specific fields
    @ApiPropertyOptional({ example: '2010-05-15' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional({ enum: Gender })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    emergencyContact?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    emergencyPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bloodGroup?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    medicalNotes?: string;

    @ApiPropertyOptional({ description: 'Class ID to assign the student to' })
    @IsOptional()
    @IsString()
    currentClassId?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
}
