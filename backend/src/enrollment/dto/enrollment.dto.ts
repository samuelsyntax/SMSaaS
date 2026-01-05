import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnrollmentDto {
    @ApiProperty()
    @IsString()
    studentId: string;

    @ApiProperty()
    @IsString()
    classId: string;

    @ApiProperty()
    @IsString()
    academicYearId: string;

    @ApiPropertyOptional({ default: 'ACTIVE' })
    @IsOptional()
    @IsIn(['ACTIVE', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED'])
    status?: string;
}

export class UpdateEnrollmentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsIn(['ACTIVE', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED'])
    status?: string;
}
