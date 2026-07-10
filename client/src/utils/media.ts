/**
 * Auction image paths are stored relative to the API server (e.g. /uploads/...).
 * The SPA runs on a different origin in dev, so we prepend the server origin,
 * derived from VITE_API_URL by stripping the trailing /api segment.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const SERVER_ORIGIN =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SERVER_ORIGIN}${pathOrUrl}`;
}
