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
import { ClassEntity } from '@/types';

interface ClassFormData {
    name: string;
    grade: string;
    section?: string;
    capacity: number;
    room?: string;
    homeroomTeacherId?: string;
}

export default function ClassesPage() {
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

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

    const [openDialog, setOpenDialog] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassEntity | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>();

    const { data, isLoading } = useQuery({
        queryKey: ['classes', paginationModel],
        queryFn: async () => {
            const response = await api.getClasses({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });
            return response.data;
        },
    });

    // Fetch teachers for dropdown
    const { data: teachersData } = useQuery({
        queryKey: ['teachers-all'],
        queryFn: async () => {
            const response = await api.getTeachers({ page: 1, limit: 100 });
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: ClassFormData) => api.createClass(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ClassFormData }) =>
            api.updateClass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteClass(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
    });

    const handleOpenDialog = (cls?: ClassEntity) => {
        if (cls) {
            setEditingClass(cls);
            reset({
                name: cls.name,
                grade: cls.grade,
                section: cls.section || '',
                capacity: cls.capacity,
                room: cls.room || '',
                homeroomTeacherId: cls.homeroomTeacher?.id || '',
            });
        } else {
            setEditingClass(null);
            reset({
                name: '',
                grade: '',
                section: '',
                capacity: 30,
                room: '',
                homeroomTeacherId: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingClass(null);
        reset();
    };

    const onSubmit = (formData: ClassFormData) => {
        const payload = {
            ...formData,
            homeroomTeacherId: formData.homeroomTeacherId || undefined,
        };
        if (editingClass) {
            updateMutation.mutate({ id: editingClass.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this class?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Class Name', width: 150 },
        { field: 'grade', headerName: 'Grade', width: 100 },
        { field: 'section', headerName: 'Section', width: 100 },
        { field: 'capacity', headerName: 'Capacity', width: 100 },
        { field: 'room', headerName: 'Room', width: 120 },
        {
            field: 'homeroomTeacher',
            headerName: 'Homeroom Teacher',
            width: 180,
            valueGetter: (params) =>
                params.row.homeroomTeacher
                    ? `${params.row.homeroomTeacher.user.firstName} ${params.row.homeroomTeacher.user.lastName}`
                    : '-',
        },
        {
            field: 'students',
            headerName: 'Students',
            width: 100,
            valueGetter: (params) => params.row._count?.currentStudents || 0,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={(params.row._count?.currentStudents || 0) >= params.row.capacity ? 'Full' : 'Open'}
                    color={(params.row._count?.currentStudents || 0) >= params.row.capacity ? 'error' : 'success'}
                    size="small"
                />
            ),
        },
        ...(isAdmin
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
                            <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
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
                    Classes
                </Typography>
                {isAdmin && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                        Add Class
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
                    <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'Class name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Class Name" error={!!errors.name} helperText={errors.name?.message} fullWidth />
                                )}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Controller
                                    name="grade"
                                    control={control}
                                    rules={{ required: 'Grade is required' }}
                                    render={({ field }) => (
                                        <TextField {...field} label="Grade" error={!!errors.grade} helperText={errors.grade?.message} fullWidth />
                                    )}
                                />
                                <Controller
                                    name="section"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Section" fullWidth />
                                    )}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Controller
                                    name="capacity"
                                    control={control}
                                    rules={{ required: 'Capacity is required', min: 1 }}
                                    render={({ field }) => (
                                        <TextField {...field} label="Capacity" type="number" error={!!errors.capacity} fullWidth />
                                    )}
                                />
                                <Controller
                                    name="room"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Room" fullWidth />
                                    )}
                                />
                            </Box>
                            <Controller
                                name="homeroomTeacherId"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Homeroom Teacher</InputLabel>
                                        <Select {...field} label="Homeroom Teacher">
                                            <MenuItem value="">None</MenuItem>
                                            {teachersData?.data?.map((teacher: any) => (
                                                <MenuItem key={teacher.id} value={teacher.id}>
                                                    {teacher.user.firstName} {teacher.user.lastName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingClass ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
