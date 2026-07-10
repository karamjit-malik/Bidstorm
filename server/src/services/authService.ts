import bcrypt from 'bcrypt';
import { AppError } from '../utils/AppError';
import { REFRESH_TOKEN_TTL_MS } from '../config';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generateVerificationToken,
} from '../utils/jwt';
import * as userModel from '../models/userModel';
import * as refreshTokenModel from '../models/refreshTokenModel';
import { sendVerificationEmail } from './emailService';
import type { PublicUser } from '../models/userModel';
import type { UserRole } from '../types';

const SALT_ROUNDS = 10;

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role?: UserRole;
}

/** Issued token pair. The raw refresh token is set as an httpOnly cookie by the controller. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const email = input.email.toLowerCase().trim();

  if (await userModel.findByEmail(email)) {
    throw new AppError('An account with this email already exists', 409);
  }
  if (await userModel.findByUsername(input.username)) {
    throw new AppError('This username is taken', 409);
  }

  // Admins are never self-assignable; only buyer/seller may self-register.
  const role: UserRole = input.role === 'seller' ? 'seller' : 'buyer';

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const verificationToken = generateVerificationToken();

  const userId = await userModel.createUser({
    email,
    passwordHash,
    username: input.username.trim(),
    fullName: input.fullName.trim(),
    role,
    verificationToken,
  });

  await sendVerificationEmail(email, verificationToken);

  const created = await userModel.findById(userId);
  if (!created) throw new AppError('Failed to create account', 500);
  return userModel.toPublicUser(created);
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await userModel.findByVerificationToken(token);
  if (!user) {
    throw new AppError('Invalid or expired verification link', 400);
  }
  await userModel.markVerified(user.id);
}

async function issueTokens(user: {
  id: number;
  email: string;
  role: UserRole;
}): Promise<AuthTokens> {
  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await refreshTokenModel.storeRefreshToken(user.id, hashRefreshToken(refreshToken), expiresAt);
  return { accessToken, refreshToken };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const user = await userModel.findByEmail(email.toLowerCase().trim());
  // Generic message — never reveal whether the email exists.
  if (!user) throw new AppError('Invalid email or password', 401);

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) throw new AppError('Invalid email or password', 401);

  if (!user.is_verified) {
    throw new AppError('Please verify your email before logging in', 403);
  }
  if (user.is_suspended) {
    throw new AppError('Your account has been suspended. Contact support.', 403);
  }

  const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role });
  return { user: userModel.toPublicUser(user), tokens };
}

/**
 * Rotates a refresh token: the presented token is revoked and a fresh pair is
 * issued. A token that isn't active (already used, revoked, or expired) is rejected.
 */
export async function rotateRefreshToken(
  presentedToken: string,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const tokenHash = hashRefreshToken(presentedToken);
  const stored = await refreshTokenModel.findActiveByHash(tokenHash);
  if (!stored) {
    throw new AppError('Invalid or expired session', 401);
  }

  // Rotation: invalidate the presented token immediately.
  await refreshTokenModel.revokeByHash(tokenHash);

  const user = await userModel.findById(stored.user_id);
  if (!user) throw new AppError('Invalid or expired session', 401);
  if (user.is_suspended) {
    throw new AppError('Your account has been suspended. Contact support.', 403);
  }

  const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role });
  return { user: userModel.toPublicUser(user), tokens };
}

export async function logout(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  await refreshTokenModel.revokeByHash(hashRefreshToken(presentedToken));
}

export async function getProfile(userId: number): Promise<PublicUser> {
  const user = await userModel.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return userModel.toPublicUser(user);
}

export interface UpdateProfileInput {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

export async function updateProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  if (input.username !== undefined) {
    const existing = await userModel.findByUsername(input.username);
    if (existing && existing.id !== userId) {
      throw new AppError('This username is taken', 409);
    }
  }
  await userModel.updateProfile(userId, input);
  return getProfile(userId);
}
