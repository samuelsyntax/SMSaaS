import { IsString, IsEnum, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../../common/types';

export class CreateAttendanceDto {
    @ApiProperty()
    @IsString()
    studentId: string;

    @ApiProperty()
    @IsString()
    classId: string;

    @ApiProperty({ example: '2024-01-15' })
    @IsDateString()
    date: string;

    @ApiProperty({ enum: AttendanceStatus })
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    remarks?: string;
}

export class BulkAttendanceItemDto {
    @ApiProperty()
    @IsString()
    studentId: string;

    @ApiProperty({ enum: AttendanceStatus })
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    remarks?: string;
}

export class BulkAttendanceDto {
    @ApiProperty()
    @IsString()
    classId: string;

    @ApiProperty({ example: '2024-01-15' })
    @IsDateString()
    date: string;

    @ApiProperty({ type: [BulkAttendanceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkAttendanceItemDto)
    attendances: BulkAttendanceItemDto[];
}

export class UpdateAttendanceDto {
    @ApiPropertyOptional({ enum: AttendanceStatus })
    @IsOptional()
    @IsEnum(AttendanceStatus)
    status?: AttendanceStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    remarks?: string;
}
