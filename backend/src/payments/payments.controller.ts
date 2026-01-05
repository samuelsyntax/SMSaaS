import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateInvoiceDto, CreatePaymentDto, UpdateInvoiceStatusDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Roles, CurrentUser } from '../common/decorators';
import { SchoolGuard } from '../common/guards';
import { Role, PaymentStatus } from '../common/types';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(SchoolGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    // ============================================================================
    // INVOICES
    // ============================================================================

    @Post('invoices')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create invoice' })
    createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.paymentsService.createInvoice(dto, currentUser);
    }

    @Get('invoices')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get all invoices' })
    @ApiQuery({ name: 'studentId', required: false })
    @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
    getInvoices(
        @Query() pagination: PaginationDto,
        @Query('studentId') studentId: string,
        @Query('status') status: PaymentStatus,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.paymentsService.getInvoices(pagination, currentUser, { studentId, status });
    }

    @Get('invoices/:id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get invoice by ID' })
    getInvoice(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.paymentsService.getInvoice(id, currentUser);
    }

    @Patch('invoices/:id/status')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update invoice status' })
    updateInvoiceStatus(
        @Param('id') id: string,
        @Body() dto: UpdateInvoiceStatusDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.paymentsService.updateInvoiceStatus(id, dto, currentUser);
    }

    @Delete('invoices/:id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Delete invoice' })
    deleteInvoice(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.paymentsService.deleteInvoice(id, currentUser);
    }

    // ============================================================================
    // PAYMENTS
    // ============================================================================

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Record a payment' })
    createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.paymentsService.createPayment(dto, currentUser);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get all payments' })
    @ApiQuery({ name: 'invoiceId', required: false })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    getPayments(
        @Query() pagination: PaginationDto,
        @Query('invoiceId') invoiceId: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        return this.paymentsService.getPayments(pagination, currentUser, { invoiceId, from, to });
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get payment by ID' })
    getPayment(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.paymentsService.getPayment(id, currentUser);
    }

    // ============================================================================
    // STUDENT FEE STATEMENT
    // ============================================================================

    @Get('students/:studentId/statement')
    @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.STUDENT, Role.PARENT)
    @ApiOperation({ summary: 'Get student fee statement' })
    getStudentFeeStatement(@Param('studentId') studentId: string, @CurrentUser() currentUser: AuthenticatedUser) {
        return this.paymentsService.getStudentFeeStatement(studentId, currentUser);
    }
}
