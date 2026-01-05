import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateGradeDto {
    @ApiProperty()
    @IsString()
    studentId: string;

    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsString()
    subjectId: string;

    @ApiProperty({ example: 85.5 })
    @IsNumber()
    @Min(0)
    marksObtained: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    remarks?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

export class BulkGradeItemDto {
    @ApiProperty()
    @IsString()
    studentId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    marksObtained: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    remarks?: string;
}

export class BulkGradeDto {
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsString()
    subjectId: string;

    @ApiProperty({ type: [BulkGradeItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkGradeItemDto)
    grades: BulkGradeItemDto[];

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

export class UpdateGradeDto extends PartialType(CreateGradeDto) { }
