export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  reputationScore: number;
  createdAt: string;
}

/** Standard API response envelope returned by the server. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
