import * as auctionModel from '../models/auctionModel';
import * as lifecycle from '../services/auctionLifecycleService';

/**
 * Ends every LIVE/EXTENDING auction whose end_time has passed
 * (LIVE/EXTENDING -> SETTLING or ENDED). Stateless and idempotent — re-queries
 * the DB each run, so restarts recover pending ends and anti-snipe extensions
 * (which move end_time) are picked up on the next tick. Returns how many ended.
 */
export async function runEndDue(): Promise<number> {
  const ids = await auctionModel.findDueToEndIds();
  let ended = 0;
  for (const id of ids) {
    const result = await lifecycle.endAuction(id);
    if (result) ended += 1;
  }
  if (ended > 0) console.log(`[jobs] ended ${ended} auction(s)`);
  return ended;
}
