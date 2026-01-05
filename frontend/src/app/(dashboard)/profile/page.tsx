'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Stack,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// Extended user type to include profile relations
interface ProfileUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
    teacherProfile?: {
        employeeId: string;
        qualification?: string;
        specialization?: string;
        teachingAssignments?: Array<{
            subject: {
                name: string;
                code: string;
            };
        }>;
        classesAsHomeroom?: Array<{
            name: string;
        }>;
    };
    studentProfile?: {
        studentId: string;
        currentClass?: {
            name: string;
            grade: string;
            section?: string;
        };
    };
}

export default function ProfilePage() {
    const { user: initialUser, setUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data: user, isLoading } = useQuery<ProfileUser>({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await api.getProfile();
            return response.data;
        },
        initialData: initialUser || undefined,
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            });
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: { firstName: string; lastName: string }) => {
            if (!user?.id) throw new Error('User ID not found');
            const response = await api.updateUser(user.id, data);
            return response.data;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setSuccessMessage('Profile updated successfully');
            setErrorMessage(null);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.message || 'Failed to update profile');
            setSuccessMessage(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({
            firstName: formData.firstName,
            lastName: formData.lastName,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const teacherProfile = user?.teacherProfile;
    const studentProfile = user?.studentProfile;

    return (
        <Box maxWidth="md" sx={{ mx: 'auto' }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your account settings and preferences.
            </Typography>

            <Card>
                <CardContent sx={{ p: 3 }}>
                    {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
                    {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Personal Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    helperText="Email cannot be changed"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Role"
                                    value={user?.role}
                                    disabled
                                    helperText="Your system role"
                                />
                            </Grid>

                            {user?.schoolId && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="School ID"
                                        value={user.schoolId}
                                        disabled
                                    />
                                </Grid>
                            )}

                            {/* Teacher-Specific Fields */}
                            {teacherProfile && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                            Teacher Information
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Employee ID"
                                            value={teacherProfile.employeeId}
                                            disabled
                                        />
                                    </Grid>

                                    {teacherProfile.qualification && (
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Qualification"
                                                value={teacherProfile.qualification}
                                                disabled
                                            />
                                        </Grid>
                                    )}

                                    {teacherProfile.specialization && (
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Specialization"
                                                value={teacherProfile.specialization}
                                                disabled
                                            />
                                        </Grid>
                                    )}

                                    {teacherProfile.teachingAssignments && teacherProfile.teachingAssignments.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Subjects Teaching
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {teacherProfile.teachingAssignments.map((assignment, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={`${assignment.subject.name} (${assignment.subject.code})`}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Grid>
                                    )}

                                    {teacherProfile.classesAsHomeroom && teacherProfile.classesAsHomeroom.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Homeroom Classes
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {teacherProfile.classesAsHomeroom.map((cls, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={cls.name}
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Grid>
                                    )}
                                </>
                            )}

                            {/* Student-Specific Fields */}
                            {studentProfile && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                            Student Information
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Student ID (Roll Number)"
                                            value={studentProfile.studentId}
                                            disabled
                                        />
                                    </Grid>

                                    {studentProfile.currentClass && (
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Current Class"
                                                value={studentProfile.currentClass.name}
                                                disabled
                                            />
                                        </Grid>
                                    )}
                                </>
                            )}

                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={<SaveIcon />}
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
