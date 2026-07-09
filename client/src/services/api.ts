import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { authStore } from '../store/authStore';
import type { ApiResponse, User } from '../types/user';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send/receive the httpOnly refresh cookie
});

// Attach the in-memory access token to every request.
api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = authStore.getState().accessToken;
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// --- Single-flight refresh: concurrent 401s share one refresh request. ---
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Bare axios (not `api`) so this request skips the interceptors below.
    const res = await axios.post<ApiResponse<{ user: User; accessToken: string }>>(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const data = res.data.data;
    if (!data) return null;
    authStore.getState().setAuth(data.user, data.accessToken);
    return data.accessToken;
  } catch {
    authStore.getState().clear();
    return null;
  }
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    // Only try to recover from a 401 once, and never for the auth endpoints
    // themselves (login/refresh failing with 401 is a real failure).
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');
    if (status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
    return api(original);
  },
);
