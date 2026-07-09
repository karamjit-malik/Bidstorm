import { api } from './api';
import type { ApiResponse, User } from '../types/user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role?: 'buyer' | 'seller';
}

interface AuthData {
  user: User;
  accessToken: string;
}

export async function login(payload: LoginPayload): Promise<AuthData> {
  const res = await api.post<ApiResponse<AuthData>>('/auth/login', payload);
  return res.data.data!;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const res = await api.post<ApiResponse<{ user: User }>>('/auth/register', payload);
  return res.data.data!.user;
}

/** Attempts a silent login using the httpOnly refresh cookie. Returns null if not logged in. */
export async function silentRefresh(): Promise<AuthData | null> {
  try {
    const res = await api.post<ApiResponse<AuthData>>('/auth/refresh');
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return res.data.data!.user;
}

export async function verifyEmail(token: string): Promise<string> {
  const res = await api.post<ApiResponse>(`/auth/verify/${token}`);
  return res.data.message ?? 'Email verified.';
}
