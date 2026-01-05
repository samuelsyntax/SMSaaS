// Shared types between frontend and backend
// Re-exported from backend for consistency

export type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'ONLINE';

export type ExamType = 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT' | 'PROJECT';

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

export interface School {
    id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    phone?: string;
    email?: string;
    isActive: boolean;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    phone?: string;
    avatar?: string;
    schoolId?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    school?: School;
}

export interface Student {
    id: string;
    studentId: string;
    dateOfBirth?: Date;
    gender?: Gender;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    user: User;
    currentClass?: ClassEntity;
    schoolId: string;
}

export interface Teacher {
    id: string;
    employeeId: string;
    qualification?: string;
    specialization?: string;
    user: User;
    schoolId: string;
}

export interface ClassEntity {
    id: string;
    name: string;
    grade: string;
    section?: string;
    capacity: number;
    room?: string;
    homeroomTeacher?: Teacher;
    _count?: { currentStudents: number };
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    creditHours: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: PaymentStatus;
    student: Student;
    items: InvoiceItem[];
    payments: Payment[];
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface Payment {
    id: string;
    paymentNumber: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
}

export interface DashboardStats {
    students: number;
    teachers: number;
    classes: number;
    pendingInvoices: number;
    todayAttendance: {
        present: number;
        total: number;
        percentage: number;
    };
}
