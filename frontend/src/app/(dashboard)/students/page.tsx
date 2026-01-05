'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

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
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { api } from '@/lib/api';
import { Student } from '@/types';

interface StudentFormData {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
}

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const [openDialog, setOpenDialog] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<StudentFormData>();

    const { data, isLoading } = useQuery({
        queryKey: ['students', paginationModel],
        queryFn: async () => {
            const response = await api.getStudents({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: StudentFormData) => api.createStudent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: StudentFormData }) =>
            api.updateStudent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteStudent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    const handleOpenDialog = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            reset({
                email: student.user.email,
                firstName: student.user.firstName,
                lastName: student.user.lastName,
                phone: student.user.phone || '',
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
                gender: student.gender || '',
                address: student.address || '',
            });
        } else {
            setEditingStudent(null);
            reset({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phone: '',
                dateOfBirth: '',
                gender: '',
                address: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingStudent(null);
        reset();
    };

    const onSubmit = (formData: StudentFormData) => {
        if (editingStudent) {
            updateMutation.mutate({ id: editingStudent.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this student?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'studentId', headerName: 'Student ID', width: 130 },
        {
            field: 'name',
            headerName: 'Name',
            width: 180,
            valueGetter: (params) => `${params.row.user?.firstName} ${params.row.user?.lastName}`,
        },
        { field: 'email', headerName: 'Email', width: 200, valueGetter: (params) => params.row.user?.email },
        {
            field: 'class',
            headerName: 'Class',
            width: 120,
            valueGetter: (params) => params.row.currentClass?.name || '-',
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.row.user?.isActive ? 'Active' : 'Inactive'}
                    color={params.row.user?.isActive ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
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
                    <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={600}>
                    Students
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Student
                </Button>
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
                    <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Controller
                                name="firstName"
                                control={control}
                                rules={{ required: 'First name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="First Name" error={!!errors.firstName} helperText={errors.firstName?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="lastName"
                                control={control}
                                rules={{ required: 'Last name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Last Name" error={!!errors.lastName} helperText={errors.lastName?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="email"
                                control={control}
                                rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
                                render={({ field }) => (
                                    <TextField {...field} label="Email" type="email" error={!!errors.email} helperText={errors.email?.message} fullWidth />
                                )}
                            />
                            {!editingStudent && (
                                <Controller
                                    name="password"
                                    control={control}
                                    rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
                                    render={({ field }) => (
                                        <TextField {...field} label="Password" type="password" error={!!errors.password} helperText={errors.password?.message} fullWidth />
                                    )}
                                />
                            )}
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Phone" fullWidth />}
                            />
                            <Controller
                                name="dateOfBirth"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} fullWidth />}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingStudent ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
