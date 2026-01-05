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
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { api } from '@/lib/api';
import { Subject } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface SubjectFormData {
    name: string;
    code: string;
    creditHours: number;
    description?: string;
}

export default function SubjectsPage() {
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
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<SubjectFormData>();

    const { data, isLoading } = useQuery({
        queryKey: ['subjects', paginationModel],
        queryFn: async () => {
            const response = await api.getSubjects({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: SubjectFormData) => api.createSubject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) =>
            api.updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteSubject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });

    const handleOpenDialog = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject);
            reset({
                name: subject.name,
                code: subject.code,
                creditHours: subject.creditHours,
                description: subject.description || '',
            });
        } else {
            setEditingSubject(null);
            reset({
                name: '',
                code: '',
                creditHours: 3,
                description: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSubject(null);
        reset();
    };

    const onSubmit = (formData: SubjectFormData) => {
        if (editingSubject) {
            updateMutation.mutate({ id: editingSubject.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this subject?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Code', width: 120 },
        { field: 'name', headerName: 'Subject Name', width: 250 },
        { field: 'creditHours', headerName: 'Credits', width: 100 },
        { field: 'description', headerName: 'Description', width: 300 },
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
                    Subjects
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Subject
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
                    <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'Subject name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Subject Name" error={!!errors.name} helperText={errors.name?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="code"
                                control={control}
                                rules={{ required: 'Subject code is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="Subject Code" error={!!errors.code} helperText={errors.code?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="creditHours"
                                control={control}
                                rules={{ required: 'Credit hours is required', min: 1 }}
                                render={({ field }) => (
                                    <TextField {...field} label="Credit Hours" type="number" error={!!errors.creditHours} helperText={errors.creditHours?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Description" multiline rows={3} fullWidth />
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingSubject ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
