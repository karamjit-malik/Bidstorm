import cron from 'node-cron';
import { runStartDue } from './auctionStartJob';
import { runEndDue } from './auctionEndJob';
import { runSettlementCheck } from './settlementCheckJob';
import { runSimilarityCompute } from './similarityComputeJob';
import { runTrendingCompute } from './trendingComputeJob';

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
  const trendingCompute = guarded('trending-compute', runTrendingCompute);
  const similarityCompute = guarded('similarity-compute', runSimilarityCompute);

  // Start/end transitions: every 5 seconds (near-real-time, bid endpoint
  // already rejects post-end bids so a few seconds' latency is harmless).
  cron.schedule('*/5 * * * * *', lifecycleSweep);

  // Settlement timeout: every 15 minutes.
  cron.schedule('*/15 * * * *', settlementSweep);

  // Trending: recompute every 15 minutes.
  cron.schedule('*/15 * * * *', trendingCompute);

  // Similarity matrix: nightly at 03:00.
  cron.schedule('0 3 * * *', similarityCompute);

  // Run once immediately so anything due during downtime is handled and the
  // recommendation caches are warm at boot.
  void lifecycleSweep();
  void settlementSweep();
  void trendingCompute();
  void similarityCompute();

  console.log(
    '[jobs] scheduler started (5s lifecycle, 15m settlement+trending, nightly similarity)',
  );
}
