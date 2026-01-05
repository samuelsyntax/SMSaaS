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
    TextField,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

interface GradeEntry {
    studentId: string;
    studentName: string;
    rollNumber: string;
    marks: number | '';
    grade: string;
    existingGradeId?: string;
}

export default function GradesPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    // All roles can view grades, but only teachers/admins can edit
    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';
    const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT';

    const [selectedExam, setSelectedExam] = useState<string>('');
    const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fetch exams
    const { data: examsData, isLoading: examsLoading } = useQuery({
        queryKey: ['exams-for-grading'],
        queryFn: async () => {
            const response = await api.getExams({ page: 1, limit: 100 });
            return response.data;
        },
    });

    // Fetch grades for selected exam
    const { data: gradesData, isLoading: gradesLoading } = useQuery({
        queryKey: ['grades', selectedExam],
        queryFn: async () => {
            const response = await api.getGrades({ examId: selectedExam });
            return response.data;
        },
        enabled: !!selectedExam,
    });

    // For students, show only their grades
    const { data: studentGrades, isLoading: studentGradesLoading } = useQuery({
        queryKey: ['my-grades'],
        queryFn: async () => {
            const response = await api.getGrades({ studentId: user?.id });
            return response.data;
        },
        enabled: isStudentOrParent,
    });

    // Get students for the selected exam's class
    const selectedExamData = examsData?.data?.find((e: any) => e.id === selectedExam);

    const { data: studentsData, isLoading: studentsLoading } = useQuery({
        queryKey: ['exam-students', selectedExamData?.classId],
        queryFn: async () => {
            const response = await api.getStudents({ classId: selectedExamData.classId, page: 1, limit: 100 });
            return response.data;
        },
        enabled: !!selectedExamData?.classId,
    });

    const handleExamChange = (examId: string) => {
        setSelectedExam(examId);
        setGradeEntries([]);
    };

    const handleLoadStudents = () => {
        if (studentsData?.data && selectedExamData) {
            const entries: GradeEntry[] = studentsData.data.map((student: any) => {
                const existingGrade = gradesData?.data?.find((g: any) => g.studentId === student.id);
                return {
                    studentId: student.id,
                    studentName: `${student.user.firstName} ${student.user.lastName}`,
                    rollNumber: student.studentId,
                    marks: existingGrade?.marksObtained ?? '',
                    grade: existingGrade?.letterGrade || '',
                    existingGradeId: existingGrade?.id,
                };
            });
            setGradeEntries(entries);
        }
    };

    const calculateLetterGrade = (marks: number, maxMarks: number): string => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    };

    const handleMarksChange = (studentId: string, marks: number | '') => {
        setGradeEntries((prev) =>
            prev.map((entry) => {
                if (entry.studentId === studentId) {
                    const grade = marks !== '' && selectedExamData
                        ? calculateLetterGrade(marks, selectedExamData.maxMarks)
                        : '';
                    return { ...entry, marks, grade };
                }
                return entry;
            })
        );
    };

    // Save grades mutation
    const saveGradesMutation = useMutation({
        mutationFn: async () => {
            const grades = gradeEntries
                .filter((entry) => entry.marks !== '')
                .map((entry) => ({
                    examId: selectedExam,
                    studentId: entry.studentId,
                    marksObtained: Number(entry.marks),
                    letterGrade: entry.grade,
                }));
            return api.createBulkGrades({ grades });
        },
        onSuccess: () => {
            setSuccessMessage('Grades saved successfully!');
            setErrorMessage(null);
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.message || 'Failed to save grades');
            setSuccessMessage(null);
        },
    });

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A+':
            case 'A':
                return 'success';
            case 'B':
                return 'primary';
            case 'C':
                return 'info';
            case 'D':
                return 'warning';
            case 'F':
                return 'error';
            default:
                return 'default';
        }
    };

    // Student/Parent view - show their grades
    if (isStudentOrParent) {
        return (
            <Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    My Grades
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    View your academic performance across all exams.
                </Typography>

                <Card>
                    <CardContent>
                        {studentGradesLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : studentGrades?.data?.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" py={4}>
                                No grades available yet.
                            </Typography>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Exam</TableCell>
                                            <TableCell>Subject</TableCell>
                                            <TableCell align="center">Marks</TableCell>
                                            <TableCell align="center">Out Of</TableCell>
                                            <TableCell align="center">Grade</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {studentGrades?.data?.map((grade: any) => (
                                            <TableRow key={grade.id}>
                                                <TableCell>{grade.exam?.name}</TableCell>
                                                <TableCell>{grade.exam?.subject?.name}</TableCell>
                                                <TableCell align="center">{grade.marksObtained}</TableCell>
                                                <TableCell align="center">{grade.exam?.maxMarks}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={grade.letterGrade}
                                                        color={getGradeColor(grade.letterGrade) as any}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={grade.marksObtained >= grade.exam?.passingMarks ? 'Pass' : 'Fail'}
                                                        color={grade.marksObtained >= grade.exam?.passingMarks ? 'success' : 'error'}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // Teacher/Admin view - grade entry
    return (
        <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                Grades
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Enter and manage student grades for exams.
            </Typography>

            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
            {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}

            {/* Controls */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 300 }}>
                            <InputLabel>Select Exam</InputLabel>
                            <Select
                                value={selectedExam}
                                label="Select Exam"
                                onChange={(e) => handleExamChange(e.target.value)}
                            >
                                {examsLoading ? (
                                    <MenuItem disabled>Loading...</MenuItem>
                                ) : (
                                    examsData?.data?.map((exam: any) => (
                                        <MenuItem key={exam.id} value={exam.id}>
                                            {exam.name} - {exam.subject?.name} ({exam.class?.name})
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            onClick={handleLoadStudents}
                            disabled={!selectedExam || studentsLoading}
                        >
                            {studentsLoading ? <CircularProgress size={20} /> : 'Load Students'}
                        </Button>

                        {selectedExamData && (
                            <Chip
                                label={`Max Marks: ${selectedExamData.maxMarks} | Pass: ${selectedExamData.passingMarks}`}
                                variant="outlined"
                            />
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Grade Entry Table */}
            {gradeEntries.length > 0 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Students ({gradeEntries.length})
                            </Typography>
                            {canEdit && (
                                <Button
                                    variant="contained"
                                    onClick={() => saveGradesMutation.mutate()}
                                    disabled={saveGradesMutation.isPending}
                                >
                                    {saveGradesMutation.isPending ? 'Saving...' : 'Save Grades'}
                                </Button>
                            )}
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Roll No.</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="center">Marks (/{selectedExamData?.maxMarks})</TableCell>
                                        <TableCell align="center">Grade</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {gradeEntries.map((entry) => (
                                        <TableRow key={entry.studentId}>
                                            <TableCell>{entry.rollNumber}</TableCell>
                                            <TableCell>{entry.studentName}</TableCell>
                                            <TableCell align="center">
                                                {canEdit ? (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={entry.marks}
                                                        onChange={(e) =>
                                                            handleMarksChange(
                                                                entry.studentId,
                                                                e.target.value === '' ? '' : Number(e.target.value)
                                                            )
                                                        }
                                                        inputProps={{ min: 0, max: selectedExamData?.maxMarks }}
                                                        sx={{ width: 80 }}
                                                    />
                                                ) : (
                                                    entry.marks
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {entry.grade && (
                                                    <Chip
                                                        label={entry.grade}
                                                        color={getGradeColor(entry.grade) as any}
                                                        size="small"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {entry.marks !== '' && selectedExamData && (
                                                    <Chip
                                                        label={Number(entry.marks) >= selectedExamData.passingMarks ? 'Pass' : 'Fail'}
                                                        color={Number(entry.marks) >= selectedExamData.passingMarks ? 'success' : 'error'}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!gradeEntries.length && selectedExam && !studentsLoading && (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                            Click "Load Students" to enter grades.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
