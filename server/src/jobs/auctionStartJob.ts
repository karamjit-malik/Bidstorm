import * as auctionModel from '../models/auctionModel';
import * as lifecycle from '../services/auctionLifecycleService';

/**
 * Starts every SCHEDULED auction whose start_time has arrived (SCHEDULED->LIVE).
 * Stateless and idempotent — it re-queries the DB each run, so a server restart
 * automatically "re-registers" pending starts. Returns how many were started.
 */
export async function runStartDue(): Promise<number> {
  const ids = await auctionModel.findDueToStartIds();
  let started = 0;
  for (const id of ids) {
    if (await lifecycle.startAuction(id)) started += 1;
  }
  if (started > 0) console.log(`[jobs] started ${started} auction(s)`);
  return started;
}
