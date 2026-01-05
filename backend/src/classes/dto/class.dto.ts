import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateClassDto {
    @ApiProperty({ example: 'Grade 10A' })
    @IsString()
    name: string;

    @ApiProperty({ example: '10' })
    @IsString()
    grade: string;

    @ApiPropertyOptional({ example: 'A' })
    @IsOptional()
    @IsString()
    section?: string;

    @ApiPropertyOptional({ default: 30 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    capacity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    room?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    homeroomTeacherId?: string;
}

export class UpdateClassDto extends PartialType(CreateClassDto) { }
