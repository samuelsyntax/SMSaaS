import { IsString, IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ExamType } from '../../common/types';

export class CreateExamDto {
    @ApiProperty({ example: 'Midterm Exam - Mathematics' })
    @IsString()
    name: string;

    @ApiProperty({ enum: ExamType })
    @IsEnum(ExamType)
    type: ExamType;

    @ApiProperty({ example: 100 })
    @IsInt()
    @Min(1)
    totalMarks: number;

    @ApiProperty({ example: 40 })
    @IsInt()
    @Min(0)
    passingMarks: number;

    @ApiProperty()
    @IsString()
    subjectId: string;

    @ApiProperty()
    @IsString()
    academicYearId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    termId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional({ description: 'Duration in minutes' })
    @IsOptional()
    @IsInt()
    @Min(1)
    duration?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateExamDto extends PartialType(CreateExamDto) { }
