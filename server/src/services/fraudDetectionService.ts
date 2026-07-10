import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../models/db';
import * as fraudModel from '../models/fraudModel';
import * as userModel from '../models/userModel';
import type { FraudSignalType } from '../models/fraudModel';

/** Thresholds & risk weights for each detector (risk in 0..1). */
const NEW_ACCOUNT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const NEW_ACCOUNT_MIN_AMOUNT = 500;
const VELOCITY_WINDOW_MS = 60 * 1000;
const VELOCITY_MAX_BIDS = 8;
const MIN_INCREMENT_MIN_COUNT = 3;
const RETRACT_MIN_COUNT = 2;

interface AuctionInfo extends RowDataPacket {
  id: number;
  min_bid_increment: number;
  seller_id: number;
}

interface BidLite extends RowDataPacket {
  bidder_id: number;
  amount: number;
  ip_address: string | null;
  is_retracted: number;
  created_at: Date;
}

/**
 * Analyses an auction's bidding for fraud/shill patterns and records any new
 * signals. Designed to run fire-and-forget after a bid commits, so failures
 * never affect bidding. Each pattern is flagged at most once (until resolved).
 */
export async function analyzeBid(
  auctionId: number,
  lastBidderId: number,
  lastAmount: number,
  ipAddress: string | null,
): Promise<void> {
  const [aRows] = await pool.query<AuctionInfo[]>(
    'SELECT id, min_bid_increment, seller_id FROM auctions WHERE id = ?',
    [auctionId],
  );
  const auction = aRows[0];
  if (!auction) return;

  const [bids] = await pool.query<BidLite[]>(
    `SELECT bidder_id, amount, ip_address, is_retracted, created_at
     FROM bids WHERE auction_id = ? ORDER BY created_at ASC, id ASC`,
    [auctionId],
  );

  await detectSameIp(auctionId, bids);
  await detectMinIncrementPattern(auctionId, Number(auction.min_bid_increment), bids);
  await detectVelocitySpike(auctionId, bids);
  await detectRetractPattern(auctionId, bids);
  await detectNewAccountHighValue(auctionId, lastBidderId, lastAmount, ipAddress);
}

async function flagOnce(input: {
  auctionId: number;
  type: FraudSignalType;
  description: string;
  riskScore: number;
  flaggedUserId: number | null;
}): Promise<void> {
  if (await fraudModel.existsUnresolved(input.auctionId, input.type, input.flaggedUserId)) return;
  await fraudModel.create({
    auctionId: input.auctionId,
    signalType: input.type,
    description: input.description,
    riskScore: input.riskScore,
    flaggedUserId: input.flaggedUserId,
  });
}

/** Multiple distinct bidders from the same IP → possible collusion/shill. */
async function detectSameIp(auctionId: number, bids: BidLite[]): Promise<void> {
  const byIp = new Map<string, Set<number>>();
  for (const b of bids) {
    if (!b.ip_address) continue;
    let set = byIp.get(b.ip_address);
    if (!set) byIp.set(b.ip_address, (set = new Set()));
    set.add(b.bidder_id);
  }
  for (const [ip, bidders] of byIp) {
    if (bidders.size >= 2) {
      await flagOnce({
        auctionId,
        type: 'same_ip',
        description: `${bidders.size} different bidders placed bids from the same IP (${ip}).`,
        riskScore: 0.8,
        flaggedUserId: null,
      });
    }
  }
}

/** A bidder repeatedly raising by exactly the minimum increment → shill walk-up. */
async function detectMinIncrementPattern(
  auctionId: number,
  increment: number,
  bids: BidLite[],
): Promise<void> {
  const active = bids.filter((b) => !b.is_retracted);
  const minRaisesByBidder = new Map<number, number>();
  for (let i = 1; i < active.length; i++) {
    const delta = Number(active[i].amount) - Number(active[i - 1].amount);
    if (Math.abs(delta - increment) < 0.005) {
      const n = (minRaisesByBidder.get(active[i].bidder_id) ?? 0) + 1;
      minRaisesByBidder.set(active[i].bidder_id, n);
    }
  }
  for (const [bidderId, count] of minRaisesByBidder) {
    if (count >= MIN_INCREMENT_MIN_COUNT) {
      await flagOnce({
        auctionId,
        type: 'min_increment_pattern',
        description: `Bidder raised by exactly the minimum increment ${count} times (possible shill bidding).`,
        riskScore: 0.55,
        flaggedUserId: bidderId,
      });
    }
  }
}

/** An abnormal burst of bids in a short window → possible bot activity. */
async function detectVelocitySpike(auctionId: number, bids: BidLite[]): Promise<void> {
  const cutoff = Date.now() - VELOCITY_WINDOW_MS;
  const recent = bids.filter((b) => new Date(b.created_at).getTime() >= cutoff);
  if (recent.length > VELOCITY_MAX_BIDS) {
    await flagOnce({
      auctionId,
      type: 'velocity_spike',
      description: `${recent.length} bids placed within 60 seconds (velocity spike).`,
      riskScore: 0.6,
      flaggedUserId: null,
    });
  }
}

/** A bidder retracting multiple bids → bid-and-retract manipulation. */
async function detectRetractPattern(auctionId: number, bids: BidLite[]): Promise<void> {
  const retractsByBidder = new Map<number, number>();
  for (const b of bids) {
    if (b.is_retracted) {
      retractsByBidder.set(b.bidder_id, (retractsByBidder.get(b.bidder_id) ?? 0) + 1);
    }
  }
  for (const [bidderId, count] of retractsByBidder) {
    if (count >= RETRACT_MIN_COUNT) {
      await flagOnce({
        auctionId,
        type: 'bid_retract_pattern',
        description: `Bidder retracted ${count} bids on this auction (possible manipulation).`,
        riskScore: 0.65,
        flaggedUserId: bidderId,
      });
    }
  }
}

/** A brand-new account placing a high-value bid → potential fraud. */
async function detectNewAccountHighValue(
  auctionId: number,
  bidderId: number,
  amount: number,
  _ipAddress: string | null,
): Promise<void> {
  if (amount < NEW_ACCOUNT_MIN_AMOUNT) return;
  const user = await userModel.findById(bidderId);
  if (!user) return;
  const ageMs = Date.now() - new Date(user.created_at).getTime();
  if (ageMs <= NEW_ACCOUNT_MAX_AGE_MS) {
    await flagOnce({
      auctionId,
      type: 'new_account_high_value',
      description: `New account (< 24h old) placed a high-value bid of ${amount.toFixed(2)}.`,
      riskScore: 0.7,
      flaggedUserId: bidderId,
    });
  }
}
