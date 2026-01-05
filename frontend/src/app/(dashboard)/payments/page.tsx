'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

import { useRouter } from 'next/navigation';

export default function PaymentsPage() {
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT', 'PARENT'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const response = await api.getInvoices({ page: 1, limit: 50 });
            return response.data;
        },
    });

    const { data: outstandingData } = useQuery({
        queryKey: ['outstanding-fees'],
        queryFn: async () => {
            const response = await api.getOutstandingFees();
            return response.data;
        },
        enabled: isAdmin,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'success';
            case 'PARTIAL':
                return 'warning';
            case 'OVERDUE':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                Fees & Payments
            </Typography>

            {isAdmin && outstandingData && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Outstanding
                                </Typography>
                                <Typography variant="h4" fontWeight={600}>
                                    ${outstandingData.reduce((sum: number, item: any) => sum + item.balance, 0).toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Overdue Invoices
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color="error.main">
                                    {outstandingData.filter((item: any) => item.daysOverdue > 0).length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Pending Invoices
                                </Typography>
                                <Typography variant="h4" fontWeight={600} color="warning.main">
                                    {outstandingData.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Invoices
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Invoice #</TableCell>
                                    <TableCell>Student</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">Paid</TableCell>
                                    <TableCell align="right">Balance</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : invoices?.data?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            No invoices found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices?.data?.map((invoice: any) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{invoice.invoiceNumber}</TableCell>
                                            <TableCell>
                                                {invoice.student?.user?.firstName} {invoice.student?.user?.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">${Number(invoice.totalAmount).toFixed(2)}</TableCell>
                                            <TableCell align="right">${Number(invoice.paidAmount).toFixed(2)}</TableCell>
                                            <TableCell align="right">${Number(invoice.balanceAmount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={invoice.status}
                                                    color={getStatusColor(invoice.status) as any}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
