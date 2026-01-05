'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
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
    Chip,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function ReportsPage() {
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();

    if (isHydrated && user && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    if (!isHydrated) {
        return null;
    }

    const [tabValue, setTabValue] = useState(0);

    // Attendance Report State
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(30, 'day'));
    const [endDate, setEndDate] = useState<Dayjs>(dayjs());

    // Financial Report State
    const [financialPeriod, setFinancialPeriod] = useState<string>('month');

    // Fetch classes
    const { data: classesData } = useQuery({
        queryKey: ['classes-report'],
        queryFn: async () => {
            const response = await api.getClasses({ page: 1, limit: 100 });
            return response.data;
        },
    });

    // Fetch attendance report
    const { data: attendanceReport, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
        queryKey: ['attendance-report', selectedClass, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
        queryFn: async () => {
            const response = await api.getAttendanceReport({
                classId: selectedClass,
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD'),
            });
            return response.data;
        },
        enabled: false,
    });

    // Fetch outstanding fees
    const { data: outstandingFees, isLoading: outstandingLoading } = useQuery({
        queryKey: ['outstanding-fees-report'],
        queryFn: async () => {
            const response = await api.getOutstandingFees();
            return response.data;
        },
    });

    // Fetch financial report
    const { data: financialReport, isLoading: financialLoading, refetch: refetchFinancial } = useQuery({
        queryKey: ['financial-report', financialPeriod],
        queryFn: async () => {
            const response = await api.getFinancialReport({ period: financialPeriod });
            return response.data;
        },
        enabled: false,
    });

    const handleGenerateAttendanceReport = () => {
        if (selectedClass) {
            refetchAttendance();
        }
    };

    const handleGenerateFinancialReport = () => {
        refetchFinancial();
    };

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'error';
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Reports
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Generate and view academic and financial reports.
                </Typography>

                <Card>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                            <Tab label="Attendance Report" />
                            <Tab label="Financial Report" />
                            <Tab label="Outstanding Fees" />
                        </Tabs>
                    </Box>

                    {/* Attendance Report Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Class</InputLabel>
                                    <Select
                                        value={selectedClass}
                                        label="Class"
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                    >
                                        {classesData?.data?.map((cls: any) => (
                                            <MenuItem key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.grade})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(v) => v && setStartDate(v)}
                                    slotProps={{ textField: { size: 'small' } }}
                                />

                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(v) => v && setEndDate(v)}
                                    slotProps={{ textField: { size: 'small' } }}
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleGenerateAttendanceReport}
                                    disabled={!selectedClass || attendanceLoading}
                                >
                                    {attendanceLoading ? <CircularProgress size={20} /> : 'Generate Report'}
                                </Button>
                            </Box>

                            {attendanceReport && (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Student</TableCell>
                                                <TableCell align="center">Present</TableCell>
                                                <TableCell align="center">Absent</TableCell>
                                                <TableCell align="center">Late</TableCell>
                                                <TableCell align="center">Total Days</TableCell>
                                                <TableCell align="center">Attendance %</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {attendanceReport.students?.map((student: any) => (
                                                <TableRow key={student.id}>
                                                    <TableCell>{student.name}</TableCell>
                                                    <TableCell align="center">{student.present}</TableCell>
                                                    <TableCell align="center">{student.absent}</TableCell>
                                                    <TableCell align="center">{student.late}</TableCell>
                                                    <TableCell align="center">{student.totalDays}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={`${student.percentage.toFixed(1)}%`}
                                                            color={getAttendanceColor(student.percentage) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {!attendanceReport && !attendanceLoading && (
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                    Select a class and date range to generate the attendance report.
                                </Typography>
                            )}
                        </CardContent>
                    </TabPanel>

                    {/* Financial Report Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Period</InputLabel>
                                    <Select
                                        value={financialPeriod}
                                        label="Period"
                                        onChange={(e) => setFinancialPeriod(e.target.value)}
                                    >
                                        <MenuItem value="week">This Week</MenuItem>
                                        <MenuItem value="month">This Month</MenuItem>
                                        <MenuItem value="quarter">This Quarter</MenuItem>
                                        <MenuItem value="year">This Year</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="contained"
                                    onClick={handleGenerateFinancialReport}
                                    disabled={financialLoading}
                                >
                                    {financialLoading ? <CircularProgress size={20} /> : 'Generate Report'}
                                </Button>
                            </Box>

                            {financialReport && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Total Invoiced
                                                </Typography>
                                                <Typography variant="h5" fontWeight={600}>
                                                    ${financialReport.totalInvoiced?.toFixed(2) || '0.00'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Total Collected
                                                </Typography>
                                                <Typography variant="h5" fontWeight={600} color="success.main">
                                                    ${financialReport.totalCollected?.toFixed(2) || '0.00'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Outstanding
                                                </Typography>
                                                <Typography variant="h5" fontWeight={600} color="error.main">
                                                    ${financialReport.outstanding?.toFixed(2) || '0.00'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Collection Rate
                                                </Typography>
                                                <Typography variant="h5" fontWeight={600}>
                                                    {financialReport.collectionRate?.toFixed(1) || '0'}%
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}

                            {!financialReport && !financialLoading && (
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                    Select a period and click Generate Report.
                                </Typography>
                            )}
                        </CardContent>
                    </TabPanel>

                    {/* Outstanding Fees Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <CardContent>
                            {outstandingLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : outstandingFees?.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                    No outstanding fees.
                                </Typography>
                            ) : (
                                <>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6">
                                            Total Outstanding: $
                                            {outstandingFees?.reduce((sum: number, item: any) => sum + item.balance, 0).toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Student</TableCell>
                                                    <TableCell>Invoice #</TableCell>
                                                    <TableCell>Due Date</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                    <TableCell align="right">Balance</TableCell>
                                                    <TableCell align="center">Days Overdue</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {outstandingFees?.map((item: any) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.studentName}</TableCell>
                                                        <TableCell>{item.invoiceNumber}</TableCell>
                                                        <TableCell>
                                                            {new Date(item.dueDate).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            ${Number(item.amount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            ${Number(item.balance).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {item.daysOverdue > 0 ? (
                                                                <Chip
                                                                    label={`${item.daysOverdue} days`}
                                                                    color="error"
                                                                    size="small"
                                                                />
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={item.status}
                                                                color={item.daysOverdue > 0 ? 'error' : 'warning'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </CardContent>
                    </TabPanel>
                </Card>
            </Box>
        </LocalizationProvider>
    );
}
