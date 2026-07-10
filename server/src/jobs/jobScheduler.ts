import cron from 'node-cron';
import { runStartDue } from './auctionStartJob';
import { runEndDue } from './auctionEndJob';
import { runSettlementCheck } from './settlementCheckJob';

let started = false;

/**
 * Wraps a job so overlapping ticks are skipped (a slow run won't pile up) and
 * errors are logged instead of crashing the scheduler.
 */
function guarded(name: string, job: () => Promise<unknown>): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await job();
    } catch (err) {
      console.error(`[jobs] "${name}" failed:`, err);
    } finally {
      running = false;
    }
  };
}

/**
 * Registers the auction lifecycle jobs. All jobs are stateless and idempotent,
 * so on server restart they recover simply by re-querying the DB — no per-
 * auction timers to re-register. Called once from server startup.
 */
export function initJobs(): void {
  if (started) return;
  started = true;

  const lifecycleSweep = guarded('lifecycle-sweep', async () => {
    await runStartDue();
    await runEndDue();
  });
  const settlementSweep = guarded('settlement-check', runSettlementCheck);

  // Start/end transitions: every 5 seconds (near-real-time, bid endpoint
  // already rejects post-end bids so a few seconds' latency is harmless).
  cron.schedule('*/5 * * * * *', lifecycleSweep);

  // Settlement timeout: every 15 minutes.
  cron.schedule('*/15 * * * *', settlementSweep);

  // Run once immediately so anything due during downtime is handled at boot.
  void lifecycleSweep();
  void settlementSweep();

  console.log('[jobs] lifecycle scheduler started (5s sweep, 15m settlement check)');
}
