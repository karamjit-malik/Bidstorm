import type { Request, Response, CookieOptions } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { config, REFRESH_TOKEN_TTL_MS } from '../config';
import * as authService from '../services/authService';

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  // In prod the SPA and API live on different domains, so the refresh cookie is
  // cross-site: it must be SameSite=None (+Secure) to be sent on /refresh. Dev
  // stays Lax (same-origin via the Vite proxy).
  sameSite: config.isProd ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: { user },
    message: 'Account created. Check your email to verify your account.',
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ success: true, data: { user, accessToken: tokens.accessToken } });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!presented) throw new AppError('No refresh token provided', 401);

  const { user, tokens } = await authService.rotateRefreshToken(presented);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ success: true, data: { user, accessToken: tokens.accessToken } });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  await authService.logout(presented);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Logged out' });
});

/** GET link from the verification email — verifies then redirects to the client. */
export const verifyEmailRedirect = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.params.token);
  res.redirect(`${config.clientOrigin}/login?verified=1`);
});

/** POST variant for programmatic verification (returns JSON). */
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.params.token);
  res.json({ success: true, message: 'Email verified. You can now log in.' });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.json({ success: true, data: { user } });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const { username, fullName, avatarUrl } = req.body;
  const user = await authService.updateProfile(req.user!.id, { username, fullName, avatarUrl });
  res.json({ success: true, data: { user } });
});
