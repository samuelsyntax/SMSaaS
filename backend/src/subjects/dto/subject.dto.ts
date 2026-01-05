import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSubjectDto {
    @ApiProperty({ example: 'Mathematics' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'MATH101' })
    @IsString()
    code: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    creditHours?: number;
}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) { }
