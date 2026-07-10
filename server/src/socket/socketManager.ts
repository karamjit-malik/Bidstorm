import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io';
import type { RowDataPacket } from 'mysql2/promise';
import { verifyAccessToken } from '../utils/jwt';
import { pool } from '../models/db';
import { config } from '../config';
import type { AuthUser } from '../types';
import {
  JOIN_AUCTION,
  LEAVE_AUCTION,
  REQUEST_TIME_SYNC,
  TIMER_SYNC,
  WATCHER_UPDATE,
  auctionRoom,
  userRoom,
} from './events';

interface SocketData {
  user: AuthUser;
  auctionId?: number;
}

type BidStormSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

let io: Server | null = null;

/** Returns the initialized Socket.io server, or throws if called too early. */
export function getIo(): Server {
  if (!io) throw new Error('Socket.io not initialized — call initSocket() first');
  return io;
}

/** Live watcher count for an auction room (from the adapter). */
export function watcherCount(auctionId: number): number {
  if (!io) return 0;
  return io.sockets.adapter.rooms.get(auctionRoom(auctionId))?.size ?? 0;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: config.clientOrigins, credentials: true },
  });

  // --- Authenticate every connection via the JWT access token. ---
  io.use((socket: BidStormSocket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      extractBearer(socket.handshake.headers.authorization);
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: BidStormSocket) => {
    const user = socket.data.user;
    // Personal room for user-targeted events (e.g. outbid alerts on any page).
    void socket.join(userRoom(user.id));

    socket.on(JOIN_AUCTION, async (payload: { auctionId: number }) => {
      const auctionId = Number(payload?.auctionId);
      if (!Number.isFinite(auctionId)) return;
      await socket.join(auctionRoom(auctionId));
      socket.data.auctionId = auctionId;
      emitWatcherUpdate(auctionId);
      await sendTimerSync(socket, auctionId);
    });

    socket.on(LEAVE_AUCTION, (payload: { auctionId: number }) => {
      const auctionId = Number(payload?.auctionId);
      if (!Number.isFinite(auctionId)) return;
      void socket.leave(auctionRoom(auctionId));
      if (socket.data.auctionId === auctionId) socket.data.auctionId = undefined;
      emitWatcherUpdate(auctionId);
    });

    socket.on(REQUEST_TIME_SYNC, async () => {
      if (socket.data.auctionId) await sendTimerSync(socket, socket.data.auctionId);
    });

    socket.on('disconnecting', () => {
      // Rooms still include this socket here, so recompute after it leaves.
      for (const room of socket.rooms) {
        if (room.startsWith('auction:')) {
          const auctionId = Number(room.slice('auction:'.length));
          setImmediate(() => emitWatcherUpdate(auctionId));
        }
      }
    });
  });

  // Periodic timer sync (every 30s) to keep client countdowns aligned.
  setInterval(() => void broadcastPeriodicTimerSync(), 30_000).unref();

  return io;
}

function extractBearer(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

function emitWatcherUpdate(auctionId: number): void {
  getIo()
    .to(auctionRoom(auctionId))
    .emit(WATCHER_UPDATE, { auctionId, watcherCount: watcherCount(auctionId) });
}

interface EndTimeRow extends RowDataPacket {
  end_time: Date;
}

async function fetchEndTime(auctionId: number): Promise<Date | null> {
  const [rows] = await pool.query<EndTimeRow[]>('SELECT end_time FROM auctions WHERE id = ?', [
    auctionId,
  ]);
  return rows[0]?.end_time ?? null;
}

async function sendTimerSync(socket: BidStormSocket, auctionId: number): Promise<void> {
  const endTime = await fetchEndTime(auctionId);
  socket.emit(TIMER_SYNC, { serverTime: new Date().toISOString(), endTime, auctionId });
}

/** Emits timer_sync to every active auction room. */
async function broadcastPeriodicTimerSync(): Promise<void> {
  if (!io) return;
  const now = new Date().toISOString();
  for (const [room, members] of io.sockets.adapter.rooms) {
    if (!room.startsWith('auction:') || members.size === 0) continue;
    const auctionId = Number(room.slice('auction:'.length));
    const endTime = await fetchEndTime(auctionId);
    io.to(room).emit(TIMER_SYNC, { serverTime: now, endTime, auctionId });
  }
}
