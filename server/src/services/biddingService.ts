import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../models/db';
import { AppError } from '../utils/AppError';
import { withOptimisticLock } from '../utils/withOptimisticLock';
import * as bidModel from '../models/bidModel';
import * as interactionModel from '../models/interactionModel';
import * as userModel from '../models/userModel';
import type { PublicBid } from '../models/bidModel';
import type { AuctionState, AuthUser } from '../types';

interface LockedAuction extends RowDataPacket {
  id: number;
  seller_id: number;
  current_bid: number;
  starting_price: number;
  min_bid_increment: number;
  bid_count: number;
  state: AuctionState;
  end_time: Date;
  anti_snipe_seconds: number;
  extension_seconds: number;
  version: number;
  title: string;
}

export interface AntiSnipeResult {
  triggered: boolean;
  newEndTime?: Date;
  extensionSeconds?: number;
}

export interface BidPlacedResult {
  bid: PublicBid;
  auction: {
    id: number;
    currentBid: number;
    bidCount: number;
    state: AuctionState;
    endTime: Date;
    title: string;
  };
  antiSnipe: AntiSnipeResult;
  /** Previous high bidder who just got outbid (null on the first bid). */
  previousBidderId: number | null;
}

/**
 * Places a bid using a row-locked transaction plus an optimistic version check,
 * exactly as documented in CLAUDE.md. Concurrent bids serialize on FOR UPDATE;
 * a stale version (lost race) yields a 409 that withOptimisticLock retries.
 */
export async function placeBid(
  auctionId: number,
  bidder: AuthUser,
  amount: number,
  ipAddress: string | null,
): Promise<BidPlacedResult> {
  return withOptimisticLock(() => attemptBid(auctionId, bidder, amount, ipAddress));
}

async function attemptBid(
  auctionId: number,
  bidder: AuthUser,
  amount: number,
  ipAddress: string | null,
): Promise<BidPlacedResult> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock the auction row for the duration of the transaction.
    const [rows] = await connection.query<LockedAuction[]>(
      `SELECT id, seller_id, current_bid, starting_price, min_bid_increment, bid_count,
              state, end_time, anti_snipe_seconds, extension_seconds, version, title
       FROM auctions WHERE id = ? FOR UPDATE`,
      [auctionId],
    );
    const auction = rows[0];
    if (!auction) throw new AppError('Auction not found', 404);

    // 2. Validate.
    if (auction.state !== 'LIVE' && auction.state !== 'EXTENDING') {
      throw new AppError('This auction is not accepting bids', 400);
    }
    if (auction.seller_id === bidder.id) {
      throw new AppError('You cannot bid on your own auction', 403);
    }
    if (new Date(auction.end_time).getTime() <= Date.now()) {
      throw new AppError('This auction has ended', 400);
    }

    const currentBid = Number(auction.current_bid);
    const increment = Number(auction.min_bid_increment);
    const startingPrice = Number(auction.starting_price);
    const hasBids = auction.bid_count > 0 && currentBid > 0;
    const minAcceptable = hasBids ? currentBid + increment : startingPrice;
    if (amount < minAcceptable) {
      throw new AppError(`Bid must be at least ${minAcceptable.toFixed(2)}`, 400);
    }

    // Who currently holds the top bid — they will be outbid by this one.
    const previousWinning = await bidModel.findWinningBid(auctionId, connection);
    const previousBidderId =
      previousWinning && previousWinning.bidder_id !== bidder.id
        ? previousWinning.bidder_id
        : null;

    // 3. Version-checked update — the crux of optimistic locking.
    const [result] = await connection.query(
      `UPDATE auctions
       SET current_bid = ?, bid_count = bid_count + 1, version = version + 1
       WHERE id = ? AND version = ?`,
      [amount, auctionId, auction.version],
    );
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new AppError('Another bid was placed first — please try again', 409);
    }
    const newVersion = auction.version + 1;

    // 4. Record the bid as the new winner.
    await bidModel.clearWinningFlag(auctionId, connection);
    const bidId = await bidModel.insertBid(connection, {
      auctionId,
      bidderId: bidder.id,
      amount,
      bidVersion: newVersion,
      ipAddress,
    });

    // 5. Anti-snipe: a bid inside the guard window extends the auction.
    const antiSnipe: AntiSnipeResult = { triggered: false };
    let newState: AuctionState = auction.state;
    let endTime = new Date(auction.end_time);
    const secondsRemaining = (endTime.getTime() - Date.now()) / 1000;
    if (secondsRemaining <= auction.anti_snipe_seconds) {
      endTime = new Date(Date.now() + auction.extension_seconds * 1000);
      newState = 'EXTENDING';
      await connection.query('UPDATE auctions SET end_time = ?, state = ? WHERE id = ?', [
        endTime,
        newState,
        auctionId,
      ]);
      await logStateChange(connection, auctionId, auction.state, newState, {
        reason: 'anti_snipe',
        extensionSeconds: auction.extension_seconds,
      });
      antiSnipe.triggered = true;
      antiSnipe.newEndTime = endTime;
      antiSnipe.extensionSeconds = auction.extension_seconds;
    }

    // 6. Record the interaction for recommendations.
    await interactionModel.recordInteraction(bidder.id, auctionId, 'bid', connection);

    await connection.commit();

    // Username for the broadcast payload (outside the write path).
    const bidderRow = await userModel.findById(bidder.id);

    const bid: PublicBid = {
      id: bidId,
      auctionId,
      bidderId: bidder.id,
      bidderUsername: bidderRow?.username ?? 'unknown',
      amount,
      isWinning: true,
      isRetracted: false,
      createdAt: new Date(),
    };

    return {
      bid,
      auction: {
        id: auctionId,
        currentBid: amount,
        bidCount: auction.bid_count + 1,
        state: newState,
        endTime,
        title: auction.title,
      },
      antiSnipe,
      previousBidderId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/** Window (ms) during which a bidder may retract a bid. */
const RETRACT_WINDOW_MS = 5 * 60 * 1000;

export interface BidRetractedResult {
  auctionId: number;
  newCurrentBid: number;
  newBidCount: number;
  bidId: number;
}

/**
 * Retracts a bid within a limited window, recomputing the auction's current
 * high bid from the remaining active bids. Runs in a row-locked transaction.
 */
export async function retractBid(
  bidId: number,
  user: AuthUser,
  reason: string,
): Promise<BidRetractedResult> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [bidRows] = await connection.query<bidModel.BidRow[]>(
      'SELECT * FROM bids WHERE id = ? FOR UPDATE',
      [bidId],
    );
    const bid = bidRows[0];
    if (!bid) throw new AppError('Bid not found', 404);
    if (bid.bidder_id !== user.id) throw new AppError('You can only retract your own bids', 403);
    if (bid.is_retracted) throw new AppError('This bid was already retracted', 409);
    if (Date.now() - new Date(bid.created_at).getTime() > RETRACT_WINDOW_MS) {
      throw new AppError('The retraction window for this bid has passed', 400);
    }

    // Lock the auction and ensure it's still active.
    const [auctionRows] = await connection.query<LockedAuction[]>(
      `SELECT id, seller_id, current_bid, starting_price, min_bid_increment, bid_count,
              state, end_time, anti_snipe_seconds, extension_seconds, version, title
       FROM auctions WHERE id = ? FOR UPDATE`,
      [bid.auction_id],
    );
    const auction = auctionRows[0];
    if (!auction) throw new AppError('Auction not found', 404);
    if (auction.state !== 'LIVE' && auction.state !== 'EXTENDING') {
      throw new AppError('Bids can only be retracted while the auction is live', 400);
    }

    await bidModel.markRetracted(bidId, connection);
    await connection.query(
      `INSERT INTO bid_retractions (bid_id, auction_id, user_id, reason) VALUES (?, ?, ?, ?)`,
      [bidId, bid.auction_id, user.id, reason],
    );

    // Recompute the standing high bid from the remaining active bids.
    const highest = await bidModel.findHighestActiveBid(bid.auction_id, connection);
    const newCurrentBid = highest ? Number(highest.amount) : 0;
    await bidModel.clearWinningFlag(bid.auction_id, connection);
    if (highest) {
      await connection.query('UPDATE bids SET is_winning = TRUE WHERE id = ?', [highest.id]);
    }
    await connection.query(
      'UPDATE auctions SET current_bid = ?, version = version + 1 WHERE id = ?',
      [newCurrentBid, bid.auction_id],
    );

    await connection.commit();

    return {
      auctionId: bid.auction_id,
      newCurrentBid,
      newBidCount: auction.bid_count, // count is preserved; the bid is flagged, not deleted
      bidId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function logStateChange(
  conn: Awaited<ReturnType<typeof pool.getConnection>>,
  auctionId: number,
  fromState: AuctionState,
  toState: AuctionState,
  metadata: Record<string, unknown>,
): Promise<void> {
  await conn.query(
    `INSERT INTO auction_state_log (auction_id, from_state, to_state, triggered_by, metadata)
     VALUES (?, ?, ?, 'anti_snipe', ?)`,
    [auctionId, fromState, toState, JSON.stringify(metadata)],
  );
}
