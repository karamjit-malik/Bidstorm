/** Centralized, typed access to environment configuration. */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  email: {
    from: process.env.FROM_EMAIL ?? 'noreply@bidstorm.com',
    smtpHost: process.env.SMTP_HOST ?? '',
    smtpPort: Number(process.env.SMTP_PORT ?? 0),
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPass: process.env.SMTP_PASS ?? '',
  },

  upload: {
    // Directory on disk where auction images are written.
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 5 * 1024 * 1024),
    maxFilesPerAuction: Number(process.env.MAX_FILES_PER_AUCTION ?? 5),
    // Public origin used to build absolute-ish image URLs (paths are stored
    // relative under /uploads; the client prepends the API origin if needed).
    publicPath: '/uploads',
  },
} as const;

/** Refresh-token lifetime in milliseconds (parsed from e.g. "7d"). */
export const REFRESH_TOKEN_TTL_MS = parseDuration(config.jwt.refreshExpiresIn);

function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
}
