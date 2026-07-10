import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useNotificationStore } from '../store/notificationStore';
import { SOCKET_EVENTS } from '../services/socketEvents';
import type { OutbidEvent } from '../types/bid';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * App-wide socket lifecycle: connects when authenticated, disconnects on logout,
 * and registers the global outbid listener so alerts arrive on any page.
 * Mount once (in App), like useAuth.
 */
export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const status = useAuthStore((s) => s.status);
  const { connect, disconnect } = useSocketStore();
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) {
      disconnect();
      return;
    }

    const socket = connect(accessToken);

    const onOutbid = (e: OutbidEvent) => {
      push({
        tone: 'warning',
        title: 'You have been outbid',
        message: `${formatCurrency(e.newAmount)} on "${e.auctionTitle}"`,
      });
    };
    socket.on(SOCKET_EVENTS.OUTBID_ALERT, onOutbid);

    return () => {
      socket.off(SOCKET_EVENTS.OUTBID_ALERT, onOutbid);
    };
  }, [accessToken, status, connect, disconnect, push]);
}
