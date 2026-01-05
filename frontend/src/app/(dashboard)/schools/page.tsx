'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
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
import { School } from '@/types';

interface SchoolFormData {
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    phone?: string;
    email?: string;
}


export default function SchoolsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    if (isHydrated && user?.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const [openDialog, setOpenDialog] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const { control, handleSubmit, reset, formState: { errors } } = useForm<SchoolFormData>();

    const { data, isLoading } = useQuery({
        queryKey: ['schools', paginationModel],
        queryFn: async () => {
            const response = await api.getSchools({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: SchoolFormData) => api.createSchool({ ...data, isActive: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: SchoolFormData }) =>
            api.updateSchool(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteSchool(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
        },
    });

    const handleOpenDialog = (school?: School) => {
        if (school) {
            setEditingSchool(school);
            reset({
                name: school.name,
                code: school.code,
                address: school.address || '',
                city: school.city || '',
                state: school.state || '',
                country: school.country || 'US',
                phone: school.phone || '',
                email: school.email || '',
            });
        } else {
            setEditingSchool(null);
            reset({
                name: '',
                code: '',
                address: '',
                city: '',
                state: '',
                country: 'US',
                phone: '',
                email: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSchool(null);
        reset();
    };

    const onSubmit = (formData: SchoolFormData) => {
        if (editingSchool) {
            updateMutation.mutate({ id: editingSchool.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this school?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Code', width: 100 },
        { field: 'name', headerName: 'School Name', width: 250 },
        { field: 'city', headerName: 'City', width: 150 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'email', headerName: 'Email', width: 200 },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.row.isActive ? 'Active' : 'Inactive'}
                    color={params.row.isActive ? 'success' : 'default'}
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
                    Schools
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add School
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
                    <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: 'School name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="School Name" error={!!errors.name} helperText={errors.name?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="code"
                                control={control}
                                rules={{ required: 'School code is required' }}
                                render={({ field }) => (
                                    <TextField {...field} label="School Code" error={!!errors.code} helperText={errors.code?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="email"
                                control={control}
                                rules={{ pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
                                render={({ field }) => (
                                    <TextField {...field} label="Email" type="email" error={!!errors.email} helperText={errors.email?.message} fullWidth />
                                )}
                            />
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Phone" fullWidth />}
                            />
                            <Controller
                                name="city"
                                control={control}
                                render={({ field }) => <TextField {...field} label="City" fullWidth />}
                            />
                            <Controller
                                name="state"
                                control={control}
                                render={({ field }) => <TextField {...field} label="State" fullWidth />}
                            />
                            <Controller
                                name="country"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Country" fullWidth />}
                            />
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Address" fullWidth multiline rows={2} />}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingSchool ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
