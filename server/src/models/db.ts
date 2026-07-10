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
  // Managed MySQL providers require TLS. rejectUnauthorized:false accepts their
  // provided certs without bundling a CA — fine for this project's scale.
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});

/**
 * Pin every pooled connection's session time zone to UTC. The driver reads
 * DATE/TIME values as UTC (`timezone: 'Z'`), so the DB session must also be UTC
 * — otherwise TIMESTAMP columns (e.g. bids.created_at, filled by
 * CURRENT_TIMESTAMP) come back shifted by the server's local offset and appear
 * in the future. DATETIME columns aren't affected, which is why end_time was fine.
 */
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
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
