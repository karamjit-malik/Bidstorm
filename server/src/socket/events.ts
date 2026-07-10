/** Canonical Socket.io event names shared by the server and client. */

// Client → Server
export const JOIN_AUCTION = 'join_auction';
export const LEAVE_AUCTION = 'leave_auction';
export const REQUEST_TIME_SYNC = 'request_time_sync';

// Server → Client
export const NEW_BID = 'new_bid';
export const BID_RETRACTED = 'bid_retracted';
export const AUCTION_STATE_CHANGE = 'auction_state_change';
export const TIMER_SYNC = 'timer_sync';
export const WATCHER_UPDATE = 'watcher_update';
export const OUTBID_ALERT = 'outbid_alert';
export const ANTI_SNIPE_EXTENSION = 'anti_snipe_extension';
export const AUCTION_ENDED = 'auction_ended';

/** Room helpers. */
export const auctionRoom = (auctionId: number | string): string => `auction:${auctionId}`;
export const userRoom = (userId: number | string): string => `user:${userId}`;
