/** Socket.io event names — must match server/src/socket/events.ts. */
export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_AUCTION: 'join_auction',
  LEAVE_AUCTION: 'leave_auction',
  REQUEST_TIME_SYNC: 'request_time_sync',
  // Server → Client
  NEW_BID: 'new_bid',
  BID_RETRACTED: 'bid_retracted',
  AUCTION_STATE_CHANGE: 'auction_state_change',
  TIMER_SYNC: 'timer_sync',
  WATCHER_UPDATE: 'watcher_update',
  OUTBID_ALERT: 'outbid_alert',
  ANTI_SNIPE_EXTENSION: 'anti_snipe_extension',
  AUCTION_ENDED: 'auction_ended',
} as const;
