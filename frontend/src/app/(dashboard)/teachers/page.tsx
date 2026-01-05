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
import { Teacher } from '@/types';

interface TeacherFormData {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    qualification: string;
    specialization: string;
    phone?: string;
}

export default function TeachersPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const [openDialog, setOpenDialog] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<TeacherFormData>();

    const { data, isLoading } = useQuery({
        queryKey: ['teachers', paginationModel],
        queryFn: async () => {
            const response = await api.getTeachers({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: TeacherFormData) => api.createTeacher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TeacherFormData }) =>
            api.updateTeacher(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteTeacher(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        },
    });

    const handleOpenDialog = (teacher?: Teacher) => {
        if (teacher) {
            setEditingTeacher(teacher);
            reset({
                email: teacher.user.email,
                firstName: teacher.user.firstName,
                lastName: teacher.user.lastName,
                qualification: teacher.qualification,
                specialization: teacher.specialization,
                phone: teacher.user.phone || '',
            });
        } else {
            setEditingTeacher(null);
            reset({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                qualification: '',
                specialization: '',
                phone: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTeacher(null);
        reset();
    };

    const onSubmit = (formData: TeacherFormData) => {
        if (editingTeacher) {
            updateMutation.mutate({ id: editingTeacher.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this teacher?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'employeeId', headerName: 'ID', width: 130 },
        {
            field: 'name',
            headerName: 'Name',
            width: 180,
            valueGetter: (params) => `${params.row.user?.firstName} ${params.row.user?.lastName}`,
        },
        { field: 'email', headerName: 'Email', width: 200, valueGetter: (params) => params.row.user?.email },
        { field: 'qualification', headerName: 'Qualification', width: 150 },
        { field: 'specialization', headerName: 'Specialization', width: 150 },
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
                    Teachers
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Teacher
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

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
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
                            {!editingTeacher && (
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
                                name="qualification"
                                control={control}
                                rules={{ required: 'Qualification is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Qualification" error={!!errors.qualification} helperText={errors.qualification?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="specialization"
                                control={control}
                                rules={{ required: 'Specialization is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Specialization" error={!!errors.specialization} helperText={errors.specialization?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Phone" fullWidth />}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingTeacher ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
