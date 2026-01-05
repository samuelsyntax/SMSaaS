import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateFeeStructureDto {
    @ApiProperty({ example: 'Tuition Fee' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 1500.00 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiPropertyOptional({ default: 'YEARLY', enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME'] })
    @IsOptional()
    @IsIn(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME'])
    frequency?: string;

    @ApiPropertyOptional({ description: 'Day of month when due' })
    @IsOptional()
    @IsNumber()
    dueDay?: number;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isOptional?: boolean;

    @ApiPropertyOptional({ description: 'Class ID if fee is class-specific' })
    @IsOptional()
    @IsString()
    classId?: string;

    @ApiProperty()
    @IsString()
    academicYearId: string;
}

export class UpdateFeeStructureDto extends PartialType(CreateFeeStructureDto) { }
