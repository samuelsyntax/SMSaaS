// Define enums locally to avoid Prisma type resolution issues
// These mirror the Prisma schema enums

export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    SCHOOL_ADMIN = 'SCHOOL_ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    EXCUSED = 'EXCUSED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
    CASH = 'CASH',
    BANK_TRANSFER = 'BANK_TRANSFER',
    CARD = 'CARD',
    CHEQUE = 'CHEQUE',
    ONLINE = 'ONLINE',
}

export enum ExamType {
    QUIZ = 'QUIZ',
    MIDTERM = 'MIDTERM',
    FINAL = 'FINAL',
    ASSIGNMENT = 'ASSIGNMENT',
    PROJECT = 'PROJECT',
}

export enum AcademicTermType {
    SEMESTER = 'SEMESTER',
    TRIMESTER = 'TRIMESTER',
    QUARTER = 'QUARTER',
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

// ============================================================================
// AUTH
// ============================================================================

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    role: Role;
    schoolId: string | null;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: Role;
    schoolId: string | null;
    firstName: string;
    lastName: string;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthenticatedUser;
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    statusCode?: number;
}

// ============================================================================
// FILTER & SORT
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export interface SortOption {
    field: string;
    order: SortOrder;
}

export interface DateRangeFilter {
    from?: Date;
    to?: Date;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface AttendanceReportData {
    studentId: string;
    studentName: string;
    className: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendancePercentage: number;
}

export interface GradeReportData {
    studentId: string;
    studentName: string;
    className: string;
    subjects: {
        subjectName: string;
        exams: {
            examName: string;
            marksObtained: number;
            totalMarks: number;
            percentage: number;
            grade: string;
        }[];
        average: number;
    }[];
    overallAverage: number;
    rank?: number;
}

export interface FinancialReportData {
    period: string;
    totalInvoiced: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    collectionRate: number;
    byFeeType: {
        feeType: string;
        amount: number;
        collected: number;
    }[];
}

export interface StudentFeeStatement {
    studentId: string;
    studentName: string;
    className: string;
    invoices: {
        invoiceNumber: string;
        issueDate: Date;
        dueDate: Date;
        totalAmount: number;
        paidAmount: number;
        balance: number;
        status: PaymentStatus;
    }[];
    totalDue: number;
    totalPaid: number;
    currentBalance: number;
}
