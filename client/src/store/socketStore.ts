import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';

/**
 * Holds the single Socket.io connection. The socket authenticates with the
 * in-memory access token and connects to the backend (proxied at /socket.io in
 * dev, or VITE_SOCKET_URL if set). Connection is managed by useSocket.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: (token: string) => Socket;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: (token: string) => {
    const existing = get().socket;
    if (existing) {
      // Refresh auth and reuse the connection.
      existing.auth = { token };
      if (!existing.connected) existing.connect();
      return existing;
    }

    const socket = SOCKET_URL
      ? io(SOCKET_URL, { auth: { token }, autoConnect: true })
      : io({ auth: { token }, autoConnect: true }); // same-origin, proxied in dev

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    set({ socket });
    return socket;
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));
