import { Notification, User, Attendance } from '../models/index.js';
import { realtime } from '../sockets/index.js';
import { todayStr } from '../utils/dates.js';

/** Create DB notification + push over socket + FCM. Fire-and-forget safe. */
export async function notify({ recipient, company, type, title, message, link, sticky = false, ongoing = false }) {
  try {
    // 1. Staff Check-In Guard (Requirement 1)
    // Most notifications should only be pushed if the staff is currently checked in.
    // Exceptions: CRITICAL system alerts, payroll, or leave updates might still be sent.
    const isCritical = ['PAYROLL_GENERATED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'SYSTEM_ALERT'].includes(type);

    if (!isCritical) {
       const activeAtt = await Attendance.findOne({
          staff: recipient,
          date: todayStr(),
          'checkIn.time': { $exists: true },
          'checkOut.time': { $exists: false }
       }).select('_id').lean();

       if (!activeAtt) {
          // If not checked in, we still record in DB but skip the real-time/push delivery
          return await Notification.create({ recipient, company, type, title, message, link });
       }
    }

    const n = await Notification.create({ recipient, company, type, title, message, link });


    // Socket.IO for real-time app users
    realtime.notify(recipient.toString(), { ...n.toObject(), sticky, ongoing });

    // FCM for background/killed app notifications
    sendPushNotification(recipient, { title, message, type, link, sticky, ongoing });

    return n;
  } catch (e) {
    console.error('notification failed:', e.message);
    return null;
  }
}

async function sendPushNotification(userId, { title, message, type, link, sticky, ongoing }) {
  try {
    const user = await User.findById(userId).select('fcmToken');
    if (!user?.fcmToken) return;

    // Placeholder for FCM implementation.
    // This should use firebase-admin or FCM REST API v1.
    // The mobile app (Capacitor) will receive this and show a notification.
    console.log(`[FCM] Sending to ${user.fcmToken}: ${title} - ${message}`);

    /*
    Example FCM Payload for "WhatsApp-like" behavior:
    {
      message: {
        token: user.fcmToken,
        notification: { title, body: message },
        data: { type, link, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'high_importance_channel',
            sticky: sticky,
            ongoing: ongoing,
            visibility: 'public'
          }
        }
      }
    }
    */
  } catch (err) {
    console.error('FCM send failed:', err.message);
  }
}

export async function notifyMany(recipients, payload) {
  return Promise.all(recipients.map((r) => notify({ ...payload, recipient: r })));
}
