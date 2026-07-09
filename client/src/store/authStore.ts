import { create } from 'zustand';
import type { User } from '../types/user';

/**
 * Auth state. The access token lives in memory only (not localStorage) to limit
 * XSS exposure; it is silently restored on page load via the httpOnly refresh
 * cookie (see useAuth bootstrap).
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));

/** Non-reactive getter for use inside axios interceptors. */
export const authStore = useAuthStore;
