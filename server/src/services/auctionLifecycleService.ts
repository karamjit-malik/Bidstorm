import * as auctionModel from '../models/auctionModel';
import * as bidModel from '../models/bidModel';
import * as escrowModel from '../models/escrowModel';
import * as interactionModel from '../models/interactionModel';
import * as notificationModel from '../models/notificationModel';
import { formatMoney } from '../utils/formatMoney';
import type { AuctionRow } from '../models/auctionModel';

/**
 * Central auction lifecycle transitions. Both the scheduled jobs and the
 * reactive read-path finalizer call through here, so ending/starting logic
 * (winner, escrow, notifications, broadcasts) lives in exactly one place.
 * Every transition is idempotent via guarded UPDATEs.
 */

export interface EndResult {
  auctionId: number;
  toState: 'ENDED' | 'SETTLING';
  winnerId: number | null;
  winningBid: number;
}

/** Safe socket broadcast — no-op if the socket layer isn't running (tests). */
async function safeBroadcast(fn: (mod: typeof import('../socket/auctionRoom')) => void): Promise<void> {
  try {
    const mod = await import('../socket/auctionRoom');
    fn(mod);
  } catch {
    /* socket not initialized */
  }
}

/** SCHEDULED -> LIVE once start_time has arrived. Returns true if it started. */
export async function startAuction(auctionId: number): Promise<boolean> {
  const row = await auctionModel.findById(auctionId);
  if (!row || row.state !== 'SCHEDULED') return false;
  if (new Date(row.start_time).getTime() > Date.now()) return false;

  const started = await auctionModel.startLive(auctionId);
  if (!started) return false;

  await auctionModel.logStateChange(auctionId, 'SCHEDULED', 'LIVE', 'system', {
    reason: 'start_time_reached',
  });
  await safeBroadcast((m) =>
    m.broadcastStateChange(auctionId, 'LIVE', new Date(row.end_time).toISOString()),
  );
  return true;
}

/**
 * LIVE/EXTENDING -> SETTLING (winner) or ENDED (no winner) once end_time has
 * passed. Determines the winner (highest active bid meeting the reserve),
 * creates the escrow, records the "won" interaction, notifies both parties, and
 * broadcasts. Returns null if the auction wasn't due or was already ended.
 */
export async function endAuction(auctionId: number): Promise<EndResult | null> {
  const row = await auctionModel.findById(auctionId);
  if (!row) return null;
  if (row.state !== 'LIVE' && row.state !== 'EXTENDING') return null;
  if (new Date(row.end_time).getTime() > Date.now()) return null;

  const highest = await bidModel.findHighestActiveBid(auctionId);
  const reserve = row.reserve_price === null ? null : Number(row.reserve_price);
  const winningBid = highest ? Number(highest.amount) : 0;
  const meetsReserve = highest !== null && (reserve === null || winningBid >= reserve);
  const winnerId = meetsReserve ? highest!.bidder_id : null;
  const toState: 'ENDED' | 'SETTLING' = winnerId ? 'SETTLING' : 'ENDED';

  const ended = await auctionModel.endExpired(auctionId, toState, winnerId);
  if (!ended) return null; // already settled by a concurrent caller

  await auctionModel.logStateChange(auctionId, row.state, toState, 'system', {
    reason: 'end_time_reached',
    winnerId,
    winningBid,
  });

  if (winnerId) {
    await settleWithWinner(row, winnerId, winningBid);
  }

  await safeBroadcast((m) => {
    m.broadcastStateChange(auctionId, toState);
    m.broadcastAuctionEnded(auctionId, { winnerId, winningBid });
  });

  return { auctionId, toState, winnerId, winningBid };
}

async function settleWithWinner(
  row: AuctionRow,
  winnerId: number,
  winningBid: number,
): Promise<void> {
  await escrowModel.createIfAbsent({
    auctionId: row.id,
    buyerId: winnerId,
    sellerId: row.seller_id,
    amount: winningBid,
  });

  // Recommendation signal: the winner "won" this item (weight 8).
  await interactionModel.recordInteraction(winnerId, row.id, 'won');

  // Notify the winning bidder and the seller.
  await notificationModel.createNotification({
    userId: winnerId,
    type: 'auction_won',
    title: 'You won an auction!',
    message: `You won "${row.title}" with a bid of ${formatMoney(winningBid)}. Please complete payment.`,
    referenceId: row.id,
    referenceType: 'auction',
  });
  await notificationModel.createNotification({
    userId: row.seller_id,
    type: 'auction_won',
    title: 'Your auction sold',
    message: `"${row.title}" sold for ${formatMoney(winningBid)}. Awaiting buyer payment.`,
    referenceId: row.id,
    referenceType: 'auction',
  });
}

/**
 * Admin suspends an auction. SCHEDULED/DRAFT -> DRAFT (pulled from schedule);
 * LIVE/EXTENDING -> ENDED (bidding stopped, winner cleared). Terminal auctions
 * can't be suspended. Returns the new state.
 */
export async function suspendAuction(
  auctionId: number,
  adminId: number,
): Promise<'DRAFT' | 'ENDED'> {
  const { AppError } = await import('../utils/AppError');
  const row = await auctionModel.findById(auctionId);
  if (!row) throw new AppError('Auction not found', 404);

  let toState: 'DRAFT' | 'ENDED';
  if (row.state === 'SCHEDULED' || row.state === 'DRAFT') toState = 'DRAFT';
  else if (row.state === 'LIVE' || row.state === 'EXTENDING') toState = 'ENDED';
  else throw new AppError(`Cannot suspend an auction in ${row.state} state`, 400);

  await auctionModel.suspend(auctionId, row.state, toState);
  await auctionModel.logStateChange(auctionId, row.state, toState, 'admin', {
    reason: 'admin_suspended',
    adminId,
  });
  await safeBroadcast((m) => m.broadcastStateChange(auctionId, toState));
  return toState;
}

/**
 * SETTLING -> ENDED for auctions whose buyer never paid within the timeout.
 * Marks the escrow refunded and notifies the seller. (Re-offering to the next
 * bidder is a future enhancement.) Returns the count of auctions timed out.
 */
export async function timeOutStaleSettlements(hours: number): Promise<number> {
  const stale = await escrowModel.findStalePending(hours);
  let count = 0;
  for (const escrow of stale) {
    const moved = await auctionModel.transition(escrow.auction_id, 'SETTLING', 'ENDED');
    if (!moved) continue;
    await escrowModel.setStatus(escrow.id, 'refunded');
    await auctionModel.logStateChange(escrow.auction_id, 'SETTLING', 'ENDED', 'system', {
      reason: 'settlement_timeout',
      hours,
    });
    await notificationModel.createNotification({
      userId: escrow.seller_id,
      type: 'payment_reminder',
      title: 'Payment not received',
      message: `The buyer did not pay within ${hours}h. The sale has been cancelled.`,
      referenceId: escrow.auction_id,
      referenceType: 'auction',
    });
    count += 1;
  }
  return count;
}
