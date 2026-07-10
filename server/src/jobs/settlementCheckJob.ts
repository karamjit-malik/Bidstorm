import * as lifecycle from '../services/auctionLifecycleService';

/** Auctions whose winner doesn't pay within this window are timed out. */
const SETTLEMENT_TIMEOUT_HOURS = 48;

/**
 * Detects stale settlements: SETTLING auctions whose escrow has been pending
 * longer than the timeout, and cancels them (SETTLING -> ENDED). Idempotent.
 */
export async function runSettlementCheck(): Promise<number> {
  const timedOut = await lifecycle.timeOutStaleSettlements(SETTLEMENT_TIMEOUT_HOURS);
  if (timedOut > 0) console.log(`[jobs] timed out ${timedOut} unpaid settlement(s)`);
  return timedOut;
}
