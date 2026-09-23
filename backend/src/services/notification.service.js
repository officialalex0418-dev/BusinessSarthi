import { Notification, User, Attendance } from '../models/index.js';
import { realtime } from '../sockets/index.js';
import { todayStr } from '../utils/dates.js';

let adminModule = null;
let isFirebaseInitialized = false;

// Dynamically initialize Firebase Admin if credentials are provided in environment
(async () => {
  try {
    const mod = await import('firebase-admin');
    adminModule = mod.default || mod;

    if (!adminModule.apps || !adminModule.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let serviceAccount;
        try {
          serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : process.env.FIREBASE_SERVICE_ACCOUNT;
        } catch (jsonErr) {
          console.error('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT JSON:', jsonErr.message);
        }

        if (serviceAccount) {
          adminModule.initializeApp({
            credential: adminModule.credential.cert(serviceAccount)
          });
          isFirebaseInitialized = true;
          console.log('[FCM] Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT env var');
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        adminModule.initializeApp({
          credential: adminModule.credential.applicationDefault()
        });
        isFirebaseInitialized = true;
        console.log('[FCM] Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
      }
    } else {
      isFirebaseInitialized = true;
    }
  } catch (err) {
    console.warn('[FCM] firebase-admin setup notice:', err.message);
  }
})();

/** Create DB notification + push over socket + FCM. Fire-and-forget safe. */
export async function notify({ recipient, company, type, title, message, link, sticky = false, ongoing = false }) {
  try {
    // Critical types & real-time communications bypass check-in guard so notifications arrive immediately
    const isCritical = [
      'PAYROLL_GENERATED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'SYSTEM_ALERT',
      'CHAT_MESSAGE', 'COMPLAINT_NEW', 'COMPLAINT_REPLY', 'SHIFT_ACTIVE', 'SHIFT_INACTIVE'
    ].includes(type);

    const targetUserId = (recipient && typeof recipient === 'object' && recipient._id)
      ? recipient._id.toString()
      : recipient?.toString();

    if (!targetUserId) return null;

    if (!isCritical) {
       const activeAtt = await Attendance.findOne({
          staff: targetUserId,
          date: todayStr(),
          'checkIn.time': { $exists: true },
          'checkOut.time': { $exists: false }
       }).select('_id').lean();

       if (!activeAtt) {
          // If not checked in, we still record in DB but skip the real-time/push delivery
          return await Notification.create({ recipient: targetUserId, company, type, title, message, link });
       }
    }

    const n = await Notification.create({ recipient: targetUserId, company, type, title, message, link });

    // Socket.IO for real-time app users
    realtime.notify(targetUserId, { ...n.toObject(), sticky, ongoing });

    // FCM for background/killed app notifications
    sendPushNotification(targetUserId, { title, message, type, link, sticky, ongoing });

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

    if (adminModule && isFirebaseInitialized) {
      await adminModule.messaging().send({
        token: user.fcmToken,
        notification: {
          title: title || 'Notification',
          body: message || ''
        },
        data: {
          type: type || '',
          link: link || '',
          sticky: String(sticky || false),
          ongoing: String(ongoing || false)
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default'
          }
        }
      });
      console.log(`[FCM] Notification successfully sent to user ${userId} (${user.fcmToken})`);
    } else {
      console.log(`[FCM] Logged notification for ${user.fcmToken} (Firebase Admin not initialized on backend): ${title} - ${message}`);
    }
  } catch (err) {
    console.error('FCM send failed:', err.message);
  }
}

export async function notifyMany(recipients, payload) {
  return Promise.all(recipients.map((r) => notify({ ...payload, recipient: r })));
}
