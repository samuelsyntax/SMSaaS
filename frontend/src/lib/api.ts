import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    }

                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } else {
                // No refresh token, redirect to login
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;

// API helper functions
export const api = {
    // Auth
    login: (email: string, password: string) =>
        apiClient.post('/auth/login', { email, password }),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refreshToken }),
    getProfile: () => apiClient.get('/auth/profile'),
    changePassword: (currentPassword: string, newPassword: string) =>
        apiClient.post('/auth/change-password', { currentPassword, newPassword }),

    // Dashboard
    getDashboardStats: () => apiClient.get('/reports/dashboard'),

    // Schools
    getSchools: (params?: object) => apiClient.get('/schools', { params }),
    getSchool: (id: string) => apiClient.get(`/schools/${id}`),
    createSchool: (data: object) => apiClient.post('/schools', data),
    updateSchool: (id: string, data: object) => apiClient.patch(`/schools/${id}`, data),
    deleteSchool: (id: string) => apiClient.delete(`/schools/${id}`),

    // Users
    getUsers: (params?: object) => apiClient.get('/users', { params }),
    getUser: (id: string) => apiClient.get(`/users/${id}`),
    createUser: (data: object) => apiClient.post('/users', data),
    updateUser: (id: string, data: object) => apiClient.patch(`/users/${id}`, data),
    deleteUser: (id: string) => apiClient.delete(`/users/${id}`),

    // Students
    getStudents: (params?: object) => apiClient.get('/students', { params }),
    getStudent: (id: string) => apiClient.get(`/students/${id}`),
    createStudent: (data: object) => apiClient.post('/students', data),
    updateStudent: (id: string, data: object) => apiClient.patch(`/students/${id}`, data),
    deleteStudent: (id: string) => apiClient.delete(`/students/${id}`),

    // Teachers
    getTeachers: (params?: object) => apiClient.get('/teachers', { params }),
    getTeacher: (id: string) => apiClient.get(`/teachers/${id}`),
    createTeacher: (data: object) => apiClient.post('/teachers', data),
    updateTeacher: (id: string, data: object) => apiClient.patch(`/teachers/${id}`, data),
    deleteTeacher: (id: string) => apiClient.delete(`/teachers/${id}`),

    // Classes
    getClasses: (params?: object) => apiClient.get('/classes', { params }),
    getClass: (id: string) => apiClient.get(`/classes/${id}`),
    createClass: (data: object) => apiClient.post('/classes', data),
    updateClass: (id: string, data: object) => apiClient.patch(`/classes/${id}`, data),
    deleteClass: (id: string) => apiClient.delete(`/classes/${id}`),

    // Subjects
    getSubjects: (params?: object) => apiClient.get('/subjects', { params }),
    getSubject: (id: string) => apiClient.get(`/subjects/${id}`),
    createSubject: (data: object) => apiClient.post('/subjects', data),
    updateSubject: (id: string, data: object) => apiClient.patch(`/subjects/${id}`, data),
    deleteSubject: (id: string) => apiClient.delete(`/subjects/${id}`),

    // Attendance
    getAttendance: (params?: object) => apiClient.get('/attendance', { params }),
    markAttendance: (data: object) => apiClient.post('/attendance', data),
    markBulkAttendance: (data: object) => apiClient.post('/attendance/bulk', data),
    getClassAttendance: (classId: string, date: string) =>
        apiClient.get(`/attendance/class/${classId}/date/${date}`),

    // Exams
    getExams: (params?: object) => apiClient.get('/exams', { params }),
    getExam: (id: string) => apiClient.get(`/exams/${id}`),
    createExam: (data: object) => apiClient.post('/exams', data),
    updateExam: (id: string, data: object) => apiClient.patch(`/exams/${id}`, data),
    deleteExam: (id: string) => apiClient.delete(`/exams/${id}`),

    // Grades
    getGrades: (params?: object) => apiClient.get('/grades', { params }),
    createGrade: (data: object) => apiClient.post('/grades', data),
    createBulkGrades: (data: object) => apiClient.post('/grades/bulk', data),
    publishGrades: (examId: string) => apiClient.post(`/grades/publish/${examId}`),

    // Fees
    getFeeStructures: (params?: object) => apiClient.get('/fees', { params }),
    getFeeStructure: (id: string) => apiClient.get(`/fees/${id}`),
    createFeeStructure: (data: object) => apiClient.post('/fees', data),
    updateFeeStructure: (id: string, data: object) => apiClient.patch(`/fees/${id}`, data),
    deleteFeeStructure: (id: string) => apiClient.delete(`/fees/${id}`),

    // Invoices & Payments
    getInvoices: (params?: object) => apiClient.get('/payments/invoices', { params }),
    getInvoice: (id: string) => apiClient.get(`/payments/invoices/${id}`),
    createInvoice: (data: object) => apiClient.post('/payments/invoices', data),
    deleteInvoice: (id: string) => apiClient.delete(`/payments/invoices/${id}`),
    getPayments: (params?: object) => apiClient.get('/payments', { params }),
    createPayment: (data: object) => apiClient.post('/payments', data),
    getStudentStatement: (studentId: string) =>
        apiClient.get(`/payments/students/${studentId}/statement`),

    // Reports
    getAttendanceReport: (params: object) => apiClient.get('/reports/attendance', { params }),
    getStudentGradeReport: (studentId: string, academicYearId: string) =>
        apiClient.get(`/reports/grades/student/${studentId}`, { params: { academicYearId } }),
    getFinancialReport: (params: object) => apiClient.get('/reports/financial', { params }),
    getOutstandingFees: () => apiClient.get('/reports/financial/outstanding'),
};
