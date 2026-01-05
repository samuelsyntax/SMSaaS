'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Skeleton,
} from '@mui/material';
import {
    People as PeopleIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Receipt as ReceiptIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { DashboardStats } from '@/types';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={600}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: `${color}.100`,
                            color: `${color}.main`,
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Skeleton width={100} height={20} />
                        <Skeleton width={60} height={40} />
                    </Box>
                    <Skeleton variant="rounded" width={48} height={48} />
                </Box>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();

    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.getDashboardStats();
            return response.data;
        },
    });

    return (
        <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome back, {user?.firstName}! Here's what's happening today.
            </Typography>

            <Grid container spacing={3}>
                {isLoading ? (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCardSkeleton />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCardSkeleton />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCardSkeleton />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCardSkeleton />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Students"
                                value={stats?.students || 0}
                                icon={<PeopleIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Teachers"
                                value={stats?.teachers || 0}
                                icon={<SchoolIcon />}
                                color="secondary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Classes"
                                value={stats?.classes || 0}
                                icon={<ClassIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Pending Invoices"
                                value={stats?.pendingInvoices || 0}
                                icon={<ReceiptIcon />}
                                color="warning"
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Today's Attendance Summary */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Today's Attendance
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            bgcolor: 'success.100',
                                            color: 'success.main',
                                            mb: 2,
                                        }}
                                    >
                                        <TrendingUpIcon sx={{ fontSize: 40 }} />
                                    </Box>
                                    {isLoading ? (
                                        <Skeleton width={60} height={48} sx={{ mx: 'auto' }} />
                                    ) : (
                                        <Typography variant="h3" fontWeight={600}>
                                            {stats?.todayAttendance?.percentage || 0}%
                                        </Typography>
                                    )}
                                    <Typography color="text.secondary">Attendance Rate</Typography>
                                    {!isLoading && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {stats?.todayAttendance?.present || 0} of {stats?.todayAttendance?.total || 0} students present
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
