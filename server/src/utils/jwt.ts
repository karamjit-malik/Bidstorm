import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import type { AuthUser, UserRole } from '../types';

interface AccessTokenPayload {
  sub: number;
  email: string;
  role: UserRole;
}

/** Signs a short-lived access token (JWT). */
export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
  });
}

/** Verifies an access token and returns the principal, or throws. */
export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, config.jwt.accessSecret) as unknown as AccessTokenPayload;
  return { id: decoded.sub, email: decoded.email, role: decoded.role };
}

/**
 * Refresh tokens are opaque, high-entropy random strings (not JWTs).
 * We store only their SHA-256 hash, so a DB leak can't be replayed.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Random opaque token used for email verification links. */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
