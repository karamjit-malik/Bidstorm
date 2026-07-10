import * as notificationModel from '../models/notificationModel';
import { emitOutbidAlert } from '../socket/auctionRoom';

/**
 * Persists an outbid notification and pushes a real-time alert to the outbid
 * user's personal socket room (delivered even if they're on another page).
 */
export async function notifyOutbid(
  userId: number,
  auctionId: number,
  auctionTitle: string,
  newAmount: number,
): Promise<void> {
  await notificationModel.createNotification({
    userId,
    type: 'outbid',
    title: 'You have been outbid',
    message: `Someone bid ${newAmount.toFixed(2)} on "${auctionTitle}".`,
    referenceId: auctionId,
    referenceType: 'auction',
  });

  emitOutbidAlert(userId, { auctionId, auctionTitle, newAmount });
}

export async function listForUser(userId: number) {
  const rows = await notificationModel.findByUser(userId);
  return rows.map(notificationModel.toPublicNotification);
}
