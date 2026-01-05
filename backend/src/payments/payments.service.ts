import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateInvoiceDto, CreatePaymentDto, UpdateInvoiceStatusDto } from './dto';
import { PaginationDto } from '../common/dto';
import { createPaginatedResult, generateInvoiceNumber, generatePaymentNumber } from '../common/utils';
import { PaginatedResult, AuthenticatedUser, Role, PaymentStatus } from '../common/types';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    // ============================================================================
    // INVOICES
    // ============================================================================

    async createInvoice(dto: CreateInvoiceDto, currentUser: AuthenticatedUser) {
        const invoiceNumber = generateInvoiceNumber();

        // Calculate totals
        const subtotal = dto.items.reduce((sum, item) => {
            return sum + (item.unitPrice * (item.quantity || 1));
        }, 0);

        const discount = dto.discount || 0;
        const tax = dto.tax || 0;
        const totalAmount = subtotal - discount + tax;
        const balanceAmount = totalAmount;

        const invoice = await this.prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    studentId: dto.studentId,
                    dueDate: new Date(dto.dueDate),
                    subtotal: new Decimal(subtotal),
                    discount: new Decimal(discount),
                    tax: new Decimal(tax),
                    totalAmount: new Decimal(totalAmount),
                    paidAmount: new Decimal(0),
                    balanceAmount: new Decimal(balanceAmount),
                    status: PaymentStatus.PENDING,
                    notes: dto.notes,
                },
            });

            // Create invoice items
            await tx.invoiceItem.createMany({
                data: dto.items.map((item) => ({
                    invoiceId: inv.id,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unitPrice: new Decimal(item.unitPrice),
                    amount: new Decimal(item.unitPrice * (item.quantity || 1)),
                    feeStructureId: item.feeStructureId,
                })),
            });

            return inv;
        });

        return this.getInvoice(invoice.id, currentUser);
    }

    async getInvoices(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { studentId?: string; status?: PaymentStatus },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            deletedAt: null,
            ...(filters?.studentId && { studentId: filters.studentId }),
            ...(filters?.status && { status: filters.status }),
            ...(schoolId && { student: { schoolId } }),
        };

        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: sortOrder || 'desc' },
                include: {
                    student: {
                        include: { user: { select: { firstName: true, lastName: true, email: true } } },
                    },
                    items: true,
                    _count: { select: { payments: true } },
                },
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return createPaginatedResult(invoices, total, pagination.page!, pagination.limit!);
    }

    async getInvoice(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const invoice = await this.prisma.invoice.findFirst({
            where: { id, deletedAt: null, ...(schoolId && { student: { schoolId } }) },
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                        currentClass: { select: { id: true, name: true } },
                    },
                },
                items: {
                    include: { feeStructure: { select: { id: true, name: true } } },
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });

        if (!invoice) throw new NotFoundException('Invoice not found');
        return invoice;
    }

    async updateInvoiceStatus(id: string, dto: UpdateInvoiceStatusDto, currentUser: AuthenticatedUser) {
        await this.getInvoice(id, currentUser);
        return this.prisma.invoice.update({
            where: { id },
            data: { status: dto.status },
        });
    }

    async deleteInvoice(id: string, currentUser: AuthenticatedUser) {
        const invoice = await this.getInvoice(id, currentUser);

        // Cannot delete if payments exist
        if (invoice.payments.length > 0) {
            throw new BadRequestException('Cannot delete invoice with existing payments');
        }

        await this.prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Invoice deleted successfully' };
    }

    // ============================================================================
    // PAYMENTS
    // ============================================================================

    async createPayment(dto: CreatePaymentDto, currentUser: AuthenticatedUser) {
        const invoice = await this.getInvoice(dto.invoiceId, currentUser);

        // Validate payment amount
        const balanceAmount = Number(invoice.balanceAmount);
        if (dto.amount > balanceAmount) {
            throw new BadRequestException(`Payment amount exceeds balance. Maximum: ${balanceAmount}`);
        }

        const paymentNumber = generatePaymentNumber();
        const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
        const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;

        // Determine new status
        let newStatus: PaymentStatus;
        if (newBalanceAmount <= 0) {
            newStatus = PaymentStatus.PAID;
        } else if (newPaidAmount > 0) {
            newStatus = PaymentStatus.PARTIAL;
        } else {
            newStatus = PaymentStatus.PENDING;
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    paymentNumber,
                    invoiceId: dto.invoiceId,
                    amount: new Decimal(dto.amount),
                    paymentMethod: dto.paymentMethod,
                    referenceNumber: dto.referenceNumber,
                    notes: dto.notes,
                    receivedById: currentUser.id,
                },
            });

            await tx.invoice.update({
                where: { id: dto.invoiceId },
                data: {
                    paidAmount: new Decimal(newPaidAmount),
                    balanceAmount: new Decimal(newBalanceAmount),
                    status: newStatus,
                },
            });

            return payment;
        });

        return result;
    }

    async getPayments(
        pagination: PaginationDto,
        currentUser: AuthenticatedUser,
        filters?: { invoiceId?: string; from?: string; to?: string },
    ): Promise<PaginatedResult<any>> {
        const { skip, take, sortOrder } = pagination;
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const where: any = {
            ...(filters?.invoiceId && { invoiceId: filters.invoiceId }),
            ...(filters?.from && filters?.to && {
                paymentDate: { gte: new Date(filters.from), lte: new Date(filters.to) },
            }),
            ...(schoolId && { invoice: { student: { schoolId } } }),
        };

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take,
                orderBy: { paymentDate: sortOrder || 'desc' },
                include: {
                    invoice: {
                        include: {
                            student: {
                                include: { user: { select: { firstName: true, lastName: true } } },
                            },
                        },
                    },
                },
            }),
            this.prisma.payment.count({ where }),
        ]);

        return createPaginatedResult(payments, total, pagination.page!, pagination.limit!);
    }

    async getPayment(id: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const payment = await this.prisma.payment.findFirst({
            where: { id, ...(schoolId && { invoice: { student: { schoolId } } }) },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: { user: { select: { firstName: true, lastName: true, email: true } } },
                        },
                    },
                },
            },
        });

        if (!payment) throw new NotFoundException('Payment not found');
        return payment;
    }

    // ============================================================================
    // STUDENT FEE STATEMENT
    // ============================================================================

    async getStudentFeeStatement(studentId: string, currentUser: AuthenticatedUser) {
        const schoolId = currentUser.role === Role.SUPER_ADMIN ? undefined : currentUser.schoolId;

        const student = await this.prisma.student.findFirst({
            where: { id: studentId, ...(schoolId && { schoolId }) },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                currentClass: { select: { id: true, name: true } },
            },
        });

        if (!student) throw new NotFoundException('Student not found');

        const invoices = await this.prisma.invoice.findMany({
            where: { studentId, deletedAt: null },
            include: { payments: true },
            orderBy: { createdAt: 'desc' },
        });

        const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        const currentBalance = totalDue - totalPaid;

        return {
            student: {
                id: student.id,
                studentId: student.studentId,
                name: `${student.user.firstName} ${student.user.lastName}`,
                email: student.user.email,
                class: student.currentClass?.name,
            },
            invoices: invoices.map((inv) => ({
                invoiceNumber: inv.invoiceNumber,
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                totalAmount: Number(inv.totalAmount),
                paidAmount: Number(inv.paidAmount),
                balance: Number(inv.balanceAmount),
                status: inv.status,
            })),
            summary: {
                totalDue,
                totalPaid,
                currentBalance,
            },
        };
    }
}
