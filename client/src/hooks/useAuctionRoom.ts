import { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../store/socketStore';
import { SOCKET_EVENTS } from '../services/socketEvents';
import type {
  AntiSnipeEvent,
  AuctionEndedEvent,
  AuctionStateChangeEvent,
  BidRetractedEvent,
  NewBidEvent,
  TimerSyncEvent,
  WatcherUpdateEvent,
} from '../types/bid';

export interface AuctionRoomHandlers {
  onNewBid?: (e: NewBidEvent) => void;
  onBidRetracted?: (e: BidRetractedEvent) => void;
  onAntiSnipe?: (e: AntiSnipeEvent) => void;
  onStateChange?: (e: AuctionStateChangeEvent) => void;
  onEnded?: (e: AuctionEndedEvent) => void;
}

export interface AuctionRoomState {
  watcherCount: number;
  /** serverTime - clientTime (ms); feed into useCountdown to correct drift. */
  serverOffsetMs: number;
  /** Latest authoritative end time from the server, if received. */
  syncedEndTime: string | null;
  connected: boolean;
}

/**
 * Joins an auction's real-time room (authenticated users only) and dispatches
 * live events. Returns presence + server-time state for the countdown.
 */
export function useAuctionRoom(
  auctionId: number | null,
  handlers: AuctionRoomHandlers,
): AuctionRoomState {
  const socket = useSocketStore((s) => s.socket);
  const connected = useSocketStore((s) => s.connected);

  const [watcherCount, setWatcherCount] = useState(0);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [syncedEndTime, setSyncedEndTime] = useState<string | null>(null);

  // Keep handlers current without re-subscribing every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socket || auctionId == null) return;

    socket.emit(SOCKET_EVENTS.JOIN_AUCTION, { auctionId });

    const onNewBid = (e: NewBidEvent) => handlersRef.current.onNewBid?.(e);
    const onRetracted = (e: BidRetractedEvent) => handlersRef.current.onBidRetracted?.(e);
    const onAntiSnipe = (e: AntiSnipeEvent) => {
      if (e.auctionId === auctionId) setSyncedEndTime(e.newEndTime);
      handlersRef.current.onAntiSnipe?.(e);
    };
    const onState = (e: AuctionStateChangeEvent) => {
      if (e.auctionId === auctionId && e.endTime) setSyncedEndTime(e.endTime);
      handlersRef.current.onStateChange?.(e);
    };
    const onEnded = (e: AuctionEndedEvent) => handlersRef.current.onEnded?.(e);
    const onWatcher = (e: WatcherUpdateEvent) => {
      if (e.auctionId === auctionId) setWatcherCount(e.watcherCount);
    };
    const onTimer = (e: TimerSyncEvent) => {
      setServerOffsetMs(Date.parse(e.serverTime) - Date.now());
      if (e.endTime) setSyncedEndTime(e.endTime);
    };

    socket.on(SOCKET_EVENTS.NEW_BID, onNewBid);
    socket.on(SOCKET_EVENTS.BID_RETRACTED, onRetracted);
    socket.on(SOCKET_EVENTS.ANTI_SNIPE_EXTENSION, onAntiSnipe);
    socket.on(SOCKET_EVENTS.AUCTION_STATE_CHANGE, onState);
    socket.on(SOCKET_EVENTS.AUCTION_ENDED, onEnded);
    socket.on(SOCKET_EVENTS.WATCHER_UPDATE, onWatcher);
    socket.on(SOCKET_EVENTS.TIMER_SYNC, onTimer);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_AUCTION, { auctionId });
      socket.off(SOCKET_EVENTS.NEW_BID, onNewBid);
      socket.off(SOCKET_EVENTS.BID_RETRACTED, onRetracted);
      socket.off(SOCKET_EVENTS.ANTI_SNIPE_EXTENSION, onAntiSnipe);
      socket.off(SOCKET_EVENTS.AUCTION_STATE_CHANGE, onState);
      socket.off(SOCKET_EVENTS.AUCTION_ENDED, onEnded);
      socket.off(SOCKET_EVENTS.WATCHER_UPDATE, onWatcher);
      socket.off(SOCKET_EVENTS.TIMER_SYNC, onTimer);
    };
  }, [socket, auctionId, connected]);

  return { watcherCount, serverOffsetMs, syncedEndTime, connected };
}
