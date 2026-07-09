import mysql from 'mysql2/promise';

/**
 * Shared MySQL connection pool. All models/services acquire connections from here.
 * Configuration comes from environment variables (see .env.example).
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'bidstorm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  timezone: 'Z',
  charset: 'utf8mb4_unicode_ci',
});

/** Verifies the pool can reach the database. Called on server startup. */
export async function assertDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
