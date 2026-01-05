'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { useRouteGuard } from '@/lib/useRouteGuard';

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    // Trigger rebuild
    const { isAuthenticated, user, isHydrated } = useAuthStore();

    // Apply route guards
    useRouteGuard();

    useEffect(() => {
        if (isHydrated && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router, isHydrated]);

    if (!isHydrated || !isAuthenticated || !user) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <QueryProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </QueryProvider>
    );
}

