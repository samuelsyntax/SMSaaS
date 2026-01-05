'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    Card,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ExamType } from '@/types';

interface ExamFormData {
    name: string;
    examType: ExamType;
    subjectId: string;
    classId: string;
    examDate: string;
    startTime: string;
    duration: number;
    maxMarks: number;
    passingMarks: number;
}

interface Exam {
    id: string;
    name: string;
    examType: ExamType;
    examDate: string;
    startTime: string;
    duration: number;
    maxMarks: number;
    passingMarks: number;
    subject: { name: string; code: string };
    class: { name: string; grade: string };
}

export default function ExamsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    // RBAC check - Teachers and above can view, only admin can create
    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';
    const canEdit = isAdmin || user?.role === 'TEACHER';

    const [openDialog, setOpenDialog] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<ExamFormData>();

    // Fetch exams
    const { data, isLoading } = useQuery({
        queryKey: ['exams', paginationModel],
        queryFn: async () => {
            const response = await api.getExams({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });
            return response.data;
        },
    });

    // Fetch subjects for dropdown
    const { data: subjectsData } = useQuery({
        queryKey: ['subjects-all'],
        queryFn: async () => {
            const response = await api.getSubjects({ page: 1, limit: 100 });
            return response.data;
        },
    });

    // Fetch classes for dropdown
    const { data: classesData } = useQuery({
        queryKey: ['classes-all'],
        queryFn: async () => {
            const response = await api.getClasses({ page: 1, limit: 100 });
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: ExamFormData) => api.createExam(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ExamFormData }) =>
            api.updateExam(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteExam(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
        },
    });

    const handleOpenDialog = (exam?: Exam) => {
        if (exam) {
            setEditingExam(exam);
            reset({
                name: exam.name,
                examType: exam.examType,
                examDate: exam.examDate.split('T')[0],
                startTime: exam.startTime,
                duration: exam.duration,
                maxMarks: exam.maxMarks,
                passingMarks: exam.passingMarks,
            });
        } else {
            setEditingExam(null);
            reset({
                name: '',
                examType: 'QUIZ',
                subjectId: '',
                classId: '',
                examDate: '',
                startTime: '09:00',
                duration: 60,
                maxMarks: 100,
                passingMarks: 40,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingExam(null);
        reset();
    };

    const onSubmit = (formData: ExamFormData) => {
        if (editingExam) {
            updateMutation.mutate({ id: editingExam.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this exam?')) {
            deleteMutation.mutate(id);
        }
    };

    const getExamTypeColor = (type: ExamType) => {
        switch (type) {
            case 'FINAL':
                return 'error';
            case 'MIDTERM':
                return 'warning';
            case 'QUIZ':
                return 'info';
            case 'ASSIGNMENT':
                return 'success';
            case 'PROJECT':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Exam Name', width: 200 },
        {
            field: 'examType',
            headerName: 'Type',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    color={getExamTypeColor(params.value as ExamType) as any}
                    size="small"
                />
            ),
        },
        {
            field: 'subject',
            headerName: 'Subject',
            width: 150,
            valueGetter: (params) => params.row.subject?.name || '-',
        },
        {
            field: 'class',
            headerName: 'Class',
            width: 120,
            valueGetter: (params) => params.row.class?.name || '-',
        },
        {
            field: 'examDate',
            headerName: 'Date',
            width: 120,
            valueGetter: (params) => new Date(params.value).toLocaleDateString(),
        },
        { field: 'duration', headerName: 'Duration (min)', width: 120 },
        { field: 'maxMarks', headerName: 'Max Marks', width: 100 },
        ...(canEdit
            ? [
                {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 120,
                    sortable: false,
                    renderCell: (params: GridRenderCellParams) => (
                        <Box>
                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {isAdmin && (
                                <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    ),
                },
            ]
            : []),
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={600}>
                    Exams
                </Typography>
                {canEdit && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                        Schedule Exam
                    </Button>
                )}
            </Box>

            <Card>
                <DataGrid
                    rows={data?.data || []}
                    columns={columns}
                    rowCount={data?.meta?.total || 0}
                    loading={isLoading}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                    autoHeight
                    sx={{ border: 'none' }}
                />
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editingExam ? 'Edit Exam' : 'Schedule New Exam'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'Exam name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Exam Name" error={!!errors.name} helperText={errors.name?.message} fullWidth />
                                )}
                            />

                            <Controller
                                name="examType"
                                control={control}
                                rules={{ required: 'Exam type is required' }}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.examType}>
                                        <InputLabel>Exam Type</InputLabel>
                                        <Select {...field} label="Exam Type">
                                            <MenuItem value="QUIZ">Quiz</MenuItem>
                                            <MenuItem value="MIDTERM">Midterm</MenuItem>
                                            <MenuItem value="FINAL">Final</MenuItem>
                                            <MenuItem value="ASSIGNMENT">Assignment</MenuItem>
                                            <MenuItem value="PROJECT">Project</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="subjectId"
                                control={control}
                                rules={{ required: 'Subject is required' }}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.subjectId}>
                                        <InputLabel>Subject</InputLabel>
                                        <Select {...field} label="Subject">
                                            {subjectsData?.data?.map((subject: any) => (
                                                <MenuItem key={subject.id} value={subject.id}>
                                                    {subject.name} ({subject.code})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="classId"
                                control={control}
                                rules={{ required: 'Class is required' }}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.classId}>
                                        <InputLabel>Class</InputLabel>
                                        <Select {...field} label="Class">
                                            {classesData?.data?.map((cls: any) => (
                                                <MenuItem key={cls.id} value={cls.id}>
                                                    {cls.name} ({cls.grade})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="examDate"
                                control={control}
                                rules={{ required: 'Exam date is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Exam Date" type="date" InputLabelProps={{ shrink: true }} error={!!errors.examDate} helperText={errors.examDate?.message} fullWidth />
                                )}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Controller
                                    name="startTime"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Start Time" type="time" InputLabelProps={{ shrink: true }} fullWidth />
                                    )}
                                />
                                <Controller
                                    name="duration"
                                    control={control}
                                    rules={{ required: 'Duration is required', min: 1 }}
                                    render={({ field }) => (
                                        <TextField {...field} label="Duration (min)" type="number" error={!!errors.duration} fullWidth />
                                    )}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Controller
                                    name="maxMarks"
                                    control={control}
                                    rules={{ required: 'Max marks is required', min: 1 }}
                                    render={({ field }) => (
                                        <TextField {...field} label="Max Marks" type="number" error={!!errors.maxMarks} fullWidth />
                                    )}
                                />
                                <Controller
                                    name="passingMarks"
                                    control={control}
                                    rules={{ required: 'Passing marks is required', min: 0 }}
                                    render={({ field }) => (
                                        <TextField {...field} label="Passing Marks" type="number" error={!!errors.passingMarks} fullWidth />
                                    )}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingExam ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
