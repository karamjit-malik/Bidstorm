import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { assertDbConnection } from './models/db';
import { initSocket } from './socket/socketManager';
import { initJobs } from './jobs/jobScheduler';

const PORT = Number(process.env.PORT ?? 5000);

async function start(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  // Real-time bidding layer (JWT-authenticated Socket.io).
  initSocket(server);

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
    // Start the auction lifecycle scheduler after the DB is confirmed reachable.
    initJobs();
  });
}

void start();
