'use client';

import { useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Book as BookIcon,
    Assignment as AssignmentIcon,
    EventNote as EventNoteIcon,
    Grade as GradeIcon,
    Payment as PaymentIcon,
    Assessment as AssessmentIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/lib/store';
import { Role } from '@/types';

const drawerWidth = 260;

interface NavItem {
    title: string;
    path: string;
    icon: ReactNode;
    roles: Role[];
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        path: '/dashboard',
        icon: <DashboardIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
        title: 'Schools',
        path: '/schools',
        icon: <SchoolIcon />,
        roles: ['SUPER_ADMIN'],
    },
    {
        title: 'Students',
        path: '/students',
        icon: <PeopleIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    },
    {
        title: 'Teachers',
        path: '/teachers',
        icon: <PeopleIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
    },
    {
        title: 'Classes',
        path: '/classes',
        icon: <ClassIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    },
    {
        title: 'Subjects',
        path: '/subjects',
        icon: <BookIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    },
    {
        title: 'Attendance',
        path: '/attendance',
        icon: <EventNoteIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    },
    {
        title: 'Exams',
        path: '/exams',
        icon: <AssignmentIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
        title: 'Grades',
        path: '/grades',
        icon: <GradeIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    },
    {
        title: 'Fees & Payments',
        path: '/payments',
        icon: <PaymentIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT', 'PARENT'],
    },
    {
        title: 'Reports',
        path: '/reports',
        icon: <AssessmentIcon />,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    },
];

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const filteredNavItems = navItems.filter(
        (item) => user && item.roles.includes(user.role)
    );

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
                    SMS
                </Typography>
                {isMobile && (
                    <IconButton onClick={handleDrawerToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Toolbar>
            <Divider />
            <List sx={{ flex: 1, px: 1 }}>
                {filteredNavItems.map((item) => (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={pathname === item.path}
                            onClick={() => {
                                router.push(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    '& .MuiListItemIcon-root': { color: 'white' },
                                    '&:hover': { backgroundColor: 'primary.dark' },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.title} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List sx={{ px: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => router.push('/settings')}
                        sx={{ borderRadius: 2 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Account">
                        <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                                {user?.firstName?.[0]}
                                {user?.lastName?.[0]}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                {user?.email}
                            </Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => router.push('/profile')}>Profile</MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
