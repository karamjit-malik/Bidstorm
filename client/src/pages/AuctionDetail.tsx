import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import Navbar from '../components/layout/Navbar';
import StateBadge from '../components/auction/StateBadge';
import CountdownTimer from '../components/auction/CountdownTimer';
import BidFeed from '../components/auction/BidFeed';
import { useAuth } from '../hooks/useAuth';
import { useAuctionRoom } from '../hooks/useAuctionRoom';
import { useNotificationStore } from '../store/notificationStore';
import * as auctionService from '../services/auctionService';
import * as bidService from '../services/bidService';
import type { AuctionDetail as AuctionDetailT, AuctionState } from '../types/auction';
import type { Bid, NewBidEvent } from '../types/bid';
import { formatCurrency } from '../utils/formatCurrency';
import { resolveImageUrl } from '../utils/media';

interface LiveState {
  currentBid: number;
  bidCount: number;
  state: AuctionState;
  endTime: string;
}

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const push = useNotificationStore((s) => s.push);

  const [auction, setAuction] = useState<AuctionDetailT | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Load auction + bid history ---
  useEffect(() => {
    if (!Number.isFinite(auctionId)) {
      setError('Invalid auction');
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([auctionService.getAuction(auctionId), bidService.getBidHistory(auctionId)])
      .then(([a, history]) => {
        setAuction(a);
        setLive({ currentBid: a.currentBid, bidCount: a.bidCount, state: a.state, endTime: a.endTime });
        setBids(history);
        setActiveImage(0);
      })
      .catch(() => setError('Auction not found'))
      .finally(() => setLoading(false));
  }, [auctionId]);

  // --- Real-time room subscription ---
  const onNewBid = useCallback((e: NewBidEvent) => {
    const bid: Bid = {
      id: e.bidId,
      auctionId,
      bidderId: 0,
      bidderUsername: e.bidderUsername,
      amount: e.amount,
      isWinning: true,
      isRetracted: false,
      createdAt: e.timestamp,
    };
    setBids((prev) => (prev.some((b) => b.id === e.bidId) ? prev : [bid, ...prev]));
    setLive((prev) => (prev ? { ...prev, currentBid: e.amount, bidCount: e.bidCount } : prev));
  }, [auctionId]);

  const onBidRetracted = useCallback((e: { bidId: number; newCurrentBid: number }) => {
    setBids((prev) => prev.map((b) => (b.id === e.bidId ? { ...b, isRetracted: true } : b)));
    setLive((prev) => (prev ? { ...prev, currentBid: e.newCurrentBid } : prev));
  }, []);

  const onAntiSnipe = useCallback(
    (e: { auctionId: number; newEndTime: string; extensionSeconds: number }) => {
      if (e.auctionId !== auctionId) return;
      setLive((prev) => (prev ? { ...prev, endTime: e.newEndTime, state: 'EXTENDING' } : prev));
      push({
        tone: 'info',
        title: 'Auction extended',
        message: `A late bid added ${e.extensionSeconds}s to the clock.`,
      });
    },
    [auctionId, push],
  );

  const onStateChange = useCallback(
    (e: { auctionId: number; newState: string; endTime?: string }) => {
      if (e.auctionId !== auctionId) return;
      setLive((prev) =>
        prev ? { ...prev, state: e.newState as AuctionState, endTime: e.endTime ?? prev.endTime } : prev,
      );
    },
    [auctionId],
  );

  const onEnded = useCallback(
    (e: { auctionId: number; winningBid: number }) => {
      if (e.auctionId !== auctionId) return;
      setLive((prev) => (prev ? { ...prev, state: 'ENDED' } : prev));
      push({ tone: 'info', title: 'Auction ended', message: `Final bid ${formatCurrency(e.winningBid)}.` });
    },
    [auctionId, push],
  );

  const handlers = useMemo(
    () => ({ onNewBid, onBidRetracted, onAntiSnipe, onStateChange, onEnded }),
    [onNewBid, onBidRetracted, onAntiSnipe, onStateChange, onEnded],
  );

  const room = useAuctionRoom(
    Number.isFinite(auctionId) && auction ? auctionId : null,
    handlers,
  );

  // --- Derived bid rules ---
  const minNextBid = useMemo(() => {
    if (!auction || !live) return 0;
    return live.currentBid > 0 ? live.currentBid + auction.minBidIncrement : auction.startingPrice;
  }, [auction, live]);

  const endTime = live?.endTime ?? auction?.endTime ?? null;

  // Time is up the moment the (server-corrected) clock passes the end time,
  // even if a state-change event hasn't arrived yet.
  const timeUp = endTime != null && Date.parse(endTime) <= Date.now() + room.serverOffsetMs;

  const canBid =
    isAuthenticated &&
    auction != null &&
    live != null &&
    (live.state === 'LIVE' || live.state === 'EXTENDING') &&
    !timeUp &&
    user?.id !== auction.sellerId;

  const isTerminal =
    live != null && (live.state === 'ENDED' || live.state === 'SETTLING' || live.state === 'COMPLETED');
  const youWon = isTerminal && auction != null && user != null && auction.winnerId === user.id;

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount < minNextBid) {
      setBidError(`Enter at least ${formatCurrency(minNextBid)}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await bidService.placeBid(auctionId, amount);
      setLive((prev) =>
        prev
          ? { ...prev, currentBid: res.auction.currentBid, bidCount: res.auction.bidCount, state: res.auction.state as AuctionState, endTime: res.auction.endTime }
          : prev,
      );
      setBidAmount('');
      push({ tone: 'success', title: 'Bid placed', message: formatCurrency(amount) });
    } catch (err) {
      setBidError(
        err instanceof AxiosError ? (err.response?.data?.error ?? 'Bid failed') : 'Bid failed',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : error || !auction || !live ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
            {error ?? 'Auction not found'}
            <div className="mt-4">
              <Link to="/auctions" className="text-brand-600 hover:underline">
                ← Back to browse
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {auction.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(auction.images[activeImage]?.imageUrl) ?? ''}
                    alt={auction.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-slate-400">No image</div>
                )}
              </div>
              {auction.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {auction.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                        i === activeImage ? 'border-brand-600' : 'border-transparent'
                      }`}
                    >
                      <img src={resolveImageUrl(img.thumbnailUrl) ?? ''} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
                <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {auction.description}
                </p>
              </div>
            </div>

            {/* Live panel */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StateBadge state={live.state} />
                <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {auction.categoryName}
                </span>
                {room.connected && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                    <span className="text-brand-500">●</span> {room.watcherCount} watching
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold">{auction.title}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Sold by @{auction.seller.username} · reputation {auction.seller.reputationScore.toFixed(2)}
              </p>

              {isTerminal && (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                    youWon
                      ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                      : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {youWon ? (
                    <>
                      🎉 <span className="font-semibold">You won this auction</span> at{' '}
                      {formatCurrency(live.currentBid)}.{' '}
                      {live.state === 'SETTLING' ? 'Complete payment to finish.' : ''}
                    </>
                  ) : auction.winnerId != null ? (
                    <>Sold for {formatCurrency(live.currentBid)} to the winning bidder.</>
                  ) : (
                    <>This auction ended with no winner (reserve not met or no bids).</>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{live.currentBid > 0 ? 'Current bid' : 'Starting price'}</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(live.currentBid > 0 ? live.currentBid : auction.startingPrice)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {live.bidCount} {live.bidCount === 1 ? 'bid' : 'bids'} · min increment{' '}
                      {formatCurrency(auction.minBidIncrement)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {live.state === 'ENDED' || live.state === 'COMPLETED' ? 'Ended' : 'Time left'}
                    </p>
                    <CountdownTimer endTime={endTime} offsetMs={room.serverOffsetMs} />
                  </div>
                </div>

                {/* Bid form */}
                {canBid ? (
                  <form onSubmit={submitBid} className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={minNextBid}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`${minNextBid.toFixed(2)} or more`}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="shrink-0 rounded-lg bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {submitting ? 'Bidding…' : 'Place bid'}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setBidAmount(minNextBid.toFixed(2))}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Bid minimum {formatCurrency(minNextBid)}
                      </button>
                      {bidError && <span className="text-xs text-red-500">{bidError}</span>}
                    </div>
                  </form>
                ) : (
                  <p className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-500 dark:border-slate-800">
                    {!isAuthenticated
                      ? 'Log in to place a bid.'
                      : user?.id === auction.sellerId
                        ? 'You cannot bid on your own auction.'
                        : timeUp || live.state === 'ENDED' || live.state === 'COMPLETED'
                          ? 'This auction has ended.'
                          : 'This auction is not accepting bids.'}
                  </p>
                )}
              </div>

              {/* Live bid feed */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Bid activity
                  {room.connected && <span className="text-xs font-normal text-green-500">● live</span>}
                </h2>
                <BidFeed bids={bids} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
