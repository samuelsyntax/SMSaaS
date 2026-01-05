import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../common/types';

// Invoice creation
export class InvoiceItemDto {
    @ApiProperty()
    @IsString()
    description: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    feeStructureId?: string;
}

export class CreateInvoiceDto {
    @ApiProperty()
    @IsString()
    studentId: string;

    @ApiProperty()
    @IsDateString()
    dueDate: string;

    @ApiProperty({ type: [InvoiceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discount?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    tax?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

// Payment creation
export class CreatePaymentDto {
    @ApiProperty()
    @IsString()
    invoiceId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateInvoiceStatusDto {
    @ApiProperty({ enum: PaymentStatus })
    @IsEnum(PaymentStatus)
    status: PaymentStatus;
}
