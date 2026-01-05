'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Role } from '@/types';

// Define role permissions for each route
const routePermissions: Record<string, Role[]> = {
    '/dashboard': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    '/schools': ['SUPER_ADMIN'],
    '/students': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    '/teachers': ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
    '/classes': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    '/subjects': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    '/attendance': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    '/exams': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    '/grades': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    '/payments': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT', 'PARENT'],
    '/reports': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
    '/profile': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    '/settings': ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
};

export function useRouteGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isHydrated } = useAuthStore();

    useEffect(() => {
        if (!isHydrated || !user) return;

        const allowedRoles = routePermissions[pathname];

        // If route has defined permissions and user role is not allowed
        if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
            router.replace('/dashboard');
        }
    }, [pathname, user, isHydrated, router]);
}
