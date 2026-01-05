import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthenticatedUser, TokenResponse } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
    user: AuthenticatedUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: AuthenticatedUser | null) => void;
    clearError: () => void;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isHydrated: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.login(email, password);
                    const data: TokenResponse = response.data;

                    // Store tokens
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);

                    set({
                        user: data.user,
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    const message = error.response?.data?.message || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },

            logout: async () => {
                try {
                    await api.logout();
                } catch {
                    // Continue with logout even if API fails
                } finally {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                }
            },

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            clearError: () => set({ error: null }),

            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
