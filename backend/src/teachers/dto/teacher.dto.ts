import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsEmail,
    MinLength,
    IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '../../common/types';

export class CreateTeacherDto {
    @ApiProperty({ example: 'teacher@school.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Jane' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Smith' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: '1985-03-20' })
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
    qualification?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    specialization?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    salary?: number;
}

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) { }
