import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { assertDbConnection } from './models/db';

const PORT = Number(process.env.PORT ?? 5000);

async function start(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  // Socket.io is attached to this HTTP server in Phase 4.

  try {
    await assertDbConnection();
    console.log('[db] connection OK');
  } catch (err) {
    console.error('[db] connection FAILED — is MySQL running and .env correct?');
    console.error(err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`[server] BidStorm API listening on http://localhost:${PORT}`);
  });
}

void start();
