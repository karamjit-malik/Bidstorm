import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import type { LoginPayload, RegisterPayload } from '../services/authService';

let bootstrapped = false;

/**
 * Auth facade. On first mount it attempts a silent login via the refresh cookie,
 * so a page reload restores the session without persisting tokens to storage.
 */
export function useAuth() {
  const { user, status, setAuth, clear } = useAuthStore();

  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;
    void (async () => {
      const result = await authService.silentRefresh();
      if (result) {
        setAuth(result.user, result.accessToken);
      } else {
        clear();
      }
    })();
  }, [setAuth, clear]);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    async login(payload: LoginPayload) {
      const { user: u, accessToken } = await authService.login(payload);
      setAuth(u, accessToken);
      return u;
    },
    async register(payload: RegisterPayload) {
      return authService.register(payload);
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        clear();
      }
    },
  };
}
