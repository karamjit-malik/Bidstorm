/** Shared server-side types. Expanded in later phases. */

export type UserRole = 'buyer' | 'seller' | 'admin';

/** Authenticated principal attached to req.user by the auth middleware. */
export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

/** Standard API response envelope used by all endpoints. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Auction lifecycle states (see the state machine in CLAUDE.md). */
export type AuctionState =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'EXTENDING'
  | 'ENDED'
  | 'SETTLING'
  | 'COMPLETED';
