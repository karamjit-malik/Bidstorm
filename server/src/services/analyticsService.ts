import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../models/db';

export interface SellerAnalytics {
  summary: {
    totalAuctions: number;
    activeAuctions: number;
    soldAuctions: number;
    totalRevenue: number;
    totalBids: number;
  };
  revenueByDay: { date: string; revenue: number }[];
  bidsByHour: { hour: number; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

/** Analytics for a single seller's dashboard (Recharts on the client). */
export async function sellerAnalytics(sellerId: number): Promise<SellerAnalytics> {
  const [summaryRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS totalAuctions,
       SUM(state IN ('LIVE','EXTENDING')) AS activeAuctions,
       SUM(state IN ('SETTLING','COMPLETED')) AS soldAuctions,
       COALESCE(SUM(CASE WHEN state IN ('SETTLING','COMPLETED') THEN current_bid END), 0) AS totalRevenue
     FROM auctions WHERE seller_id = ?`,
    [sellerId],
  );
  const [bidCountRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS totalBids FROM bids b
     JOIN auctions a ON a.id = b.auction_id WHERE a.seller_id = ?`,
    [sellerId],
  );

  const [revenueRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE(updated_at) AS d, COALESCE(SUM(current_bid), 0) AS revenue
     FROM auctions
     WHERE seller_id = ? AND state IN ('SETTLING','COMPLETED')
       AND updated_at >= (UTC_TIMESTAMP() - INTERVAL 14 DAY)
     GROUP BY DATE(updated_at) ORDER BY d ASC`,
    [sellerId],
  );

  const [hourRows] = await pool.query<RowDataPacket[]>(
    `SELECT HOUR(b.created_at) AS h, COUNT(*) AS c
     FROM bids b JOIN auctions a ON a.id = b.auction_id
     WHERE a.seller_id = ? GROUP BY HOUR(b.created_at)`,
    [sellerId],
  );

  const [categoryRows] = await pool.query<RowDataPacket[]>(
    `SELECT c.name AS category, COUNT(*) AS count
     FROM auctions a JOIN categories c ON c.id = a.category_id
     WHERE a.seller_id = ? GROUP BY c.id ORDER BY count DESC`,
    [sellerId],
  );

  const s = summaryRows[0] ?? {};
  const hourMap = new Map(hourRows.map((r) => [Number(r.h), Number(r.c)]));

  return {
    summary: {
      totalAuctions: Number(s.totalAuctions ?? 0),
      activeAuctions: Number(s.activeAuctions ?? 0),
      soldAuctions: Number(s.soldAuctions ?? 0),
      totalRevenue: Number(s.totalRevenue ?? 0),
      totalBids: Number(bidCountRows[0]?.totalBids ?? 0),
    },
    revenueByDay: revenueRows.map((r) => ({
      date: formatDate(r.d),
      revenue: Number(r.revenue),
    })),
    // Fill all 24 hours so the chart has a continuous x-axis.
    bidsByHour: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourMap.get(hour) ?? 0,
    })),
    categoryBreakdown: categoryRows.map((r) => ({
      category: String(r.category),
      count: Number(r.count),
    })),
  };
}

export interface PlatformOverview {
  totals: {
    users: number;
    auctions: number;
    bids: number;
    grossMerchandiseValue: number;
    activeAuctions: number;
    openFraudSignals: number;
  };
  auctionsByState: { state: string; count: number }[];
  topCategories: { category: string; count: number }[];
}

/** Platform-wide analytics for the admin dashboard. */
export async function platformOverview(): Promise<PlatformOverview> {
  const [totalsRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM auctions) AS auctions,
       (SELECT COUNT(*) FROM bids) AS bids,
       (SELECT COALESCE(SUM(amount), 0) FROM payment_escrow) AS gmv,
       (SELECT COUNT(*) FROM auctions WHERE state IN ('LIVE','EXTENDING')) AS activeAuctions,
       (SELECT COUNT(*) FROM fraud_signals WHERE is_resolved = FALSE) AS openSignals`,
  );
  const [stateRows] = await pool.query<RowDataPacket[]>(
    'SELECT state, COUNT(*) AS count FROM auctions GROUP BY state',
  );
  const [catRows] = await pool.query<RowDataPacket[]>(
    `SELECT c.name AS category, COUNT(*) AS count
     FROM auctions a JOIN categories c ON c.id = a.category_id
     GROUP BY c.id ORDER BY count DESC LIMIT 6`,
  );

  const t = totalsRows[0] ?? {};
  return {
    totals: {
      users: Number(t.users ?? 0),
      auctions: Number(t.auctions ?? 0),
      bids: Number(t.bids ?? 0),
      grossMerchandiseValue: Number(t.gmv ?? 0),
      activeAuctions: Number(t.activeAuctions ?? 0),
      openFraudSignals: Number(t.openSignals ?? 0),
    },
    auctionsByState: stateRows.map((r) => ({ state: String(r.state), count: Number(r.count) })),
    topCategories: catRows.map((r) => ({ category: String(r.category), count: Number(r.count) })),
  };
}

function formatDate(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value));
  return d.toISOString().slice(0, 10);
}
