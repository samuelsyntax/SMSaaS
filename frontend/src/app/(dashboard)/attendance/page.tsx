'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AttendanceStatus } from '@/types';

interface AttendanceRecord {
    studentId: string;
    studentName: string;
    rollNumber: string;
    status: AttendanceStatus;
}

export default function AttendancePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, isHydrated } = useAuthStore();

    // RBAC check
    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fetch classes
    const { data: classesData, isLoading: classesLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await api.getClasses({ page: 1, limit: 100 });
            return response.data;
        },
    });

    // Fetch students for selected class
    const { data: studentsData, isLoading: studentsLoading } = useQuery({
        queryKey: ['class-students', selectedClass],
        queryFn: async () => {
            const response = await api.getStudents({ classId: selectedClass, page: 1, limit: 100 });
            return response.data;
        },
        enabled: !!selectedClass,
    });

    // Fetch existing attendance for selected class and date
    const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({
        queryKey: ['attendance', selectedClass, selectedDate.format('YYYY-MM-DD')],
        queryFn: async () => {
            const response = await api.getClassAttendance(selectedClass, selectedDate.format('YYYY-MM-DD'));
            return response.data;
        },
        enabled: !!selectedClass,
    });

    // Initialize attendance data when students or existing attendance loads
    useState(() => {
        if (studentsData?.data && selectedClass) {
            const records: AttendanceRecord[] = studentsData.data.map((student: any) => {
                const existing = existingAttendance?.find((a: any) => a.studentId === student.id);
                return {
                    studentId: student.id,
                    studentName: `${student.user.firstName} ${student.user.lastName}`,
                    rollNumber: student.studentId,
                    status: existing?.status || 'PRESENT',
                };
            });
            setAttendanceData(records);
        }
    });

    // Update attendance data when students load
    const handleClassChange = (classId: string) => {
        setSelectedClass(classId);
        setAttendanceData([]);
    };

    // Mark attendance mutation
    const markAttendanceMutation = useMutation({
        mutationFn: async () => {
            const records = attendanceData.map((record) => ({
                studentId: record.studentId,
                classId: selectedClass,
                date: selectedDate.format('YYYY-MM-DD'),
                status: record.status,
            }));
            return api.markBulkAttendance({ records });
        },
        onSuccess: () => {
            setSuccessMessage('Attendance marked successfully!');
            setErrorMessage(null);
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.message || 'Failed to mark attendance');
            setSuccessMessage(null);
        },
    });

    const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
        setAttendanceData((prev) =>
            prev.map((record) =>
                record.studentId === studentId ? { ...record, status: newStatus } : record
            )
        );
    };

    const handleLoadStudents = () => {
        if (studentsData?.data) {
            const records: AttendanceRecord[] = studentsData.data.map((student: any) => {
                const existing = existingAttendance?.find((a: any) => a.studentId === student.id);
                return {
                    studentId: student.id,
                    studentName: `${student.user.firstName} ${student.user.lastName}`,
                    rollNumber: student.studentId,
                    status: existing?.status || 'PRESENT',
                };
            });
            setAttendanceData(records);
        }
    };

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case 'PRESENT':
                return 'success';
            case 'ABSENT':
                return 'error';
            case 'LATE':
                return 'warning';
            case 'EXCUSED':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Attendance
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Mark daily attendance for students by class.
                </Typography>

                {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
                {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}

                {/* Controls */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                            <DatePicker
                                label="Date"
                                value={selectedDate}
                                onChange={(newDate) => newDate && setSelectedDate(newDate)}
                                maxDate={dayjs()}
                                slotProps={{ textField: { size: 'small' } }}
                            />

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={selectedClass}
                                    label="Class"
                                    onChange={(e) => handleClassChange(e.target.value)}
                                >
                                    {classesLoading ? (
                                        <MenuItem disabled>Loading...</MenuItem>
                                    ) : (
                                        classesData?.data?.map((cls: any) => (
                                            <MenuItem key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.grade})
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                onClick={handleLoadStudents}
                                disabled={!selectedClass || studentsLoading}
                            >
                                {studentsLoading ? <CircularProgress size={20} /> : 'Load Students'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Attendance Table */}
                {attendanceData.length > 0 && (
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Students ({attendanceData.length})
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => markAttendanceMutation.mutate()}
                                    disabled={markAttendanceMutation.isPending}
                                >
                                    {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                                </Button>
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Roll No.</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attendanceData.map((record) => (
                                            <TableRow key={record.studentId}>
                                                <TableCell>{record.rollNumber}</TableCell>
                                                <TableCell>{record.studentName}</TableCell>
                                                <TableCell>
                                                    <ToggleButtonGroup
                                                        value={record.status}
                                                        exclusive
                                                        onChange={(_, newStatus) =>
                                                            newStatus && handleStatusChange(record.studentId, newStatus)
                                                        }
                                                        size="small"
                                                    >
                                                        <ToggleButton value="PRESENT" color="success">
                                                            Present
                                                        </ToggleButton>
                                                        <ToggleButton value="ABSENT" color="error">
                                                            Absent
                                                        </ToggleButton>
                                                        <ToggleButton value="LATE" color="warning">
                                                            Late
                                                        </ToggleButton>
                                                        <ToggleButton value="EXCUSED" color="info">
                                                            Excused
                                                        </ToggleButton>
                                                    </ToggleButtonGroup>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Summary */}
                            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`Present: ${attendanceData.filter((r) => r.status === 'PRESENT').length}`}
                                    color="success"
                                />
                                <Chip
                                    label={`Absent: ${attendanceData.filter((r) => r.status === 'ABSENT').length}`}
                                    color="error"
                                />
                                <Chip
                                    label={`Late: ${attendanceData.filter((r) => r.status === 'LATE').length}`}
                                    color="warning"
                                />
                                <Chip
                                    label={`Excused: ${attendanceData.filter((r) => r.status === 'EXCUSED').length}`}
                                    color="info"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Empty state */}
                {!attendanceData.length && selectedClass && !studentsLoading && (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                Click "Load Students" to view and mark attendance.
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </LocalizationProvider>
    );
}
