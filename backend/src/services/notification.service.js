import admin from 'firebase-admin';
import { Notification, User, Attendance } from '../models/index.js';
import { realtime } from '../sockets/index.js';
import { todayStr } from '../utils/dates.js';

let isFirebaseInitialized = false;

function initFirebaseAdmin() {
  if (isFirebaseInitialized) return true;
  if (admin.apps && admin.apps.length > 0) {
    isFirebaseInitialized = true;
    return true;
  }

  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  let serviceAccount = null;

  if (rawEnv) {
    let str = typeof rawEnv === 'string' ? rawEnv.trim() : rawEnv;
    if (typeof str === 'string') {
      if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
        str = str.slice(1, -1).trim();
      }
      try {
        serviceAccount = JSON.parse(str);
      } catch (e1) {
        try {
          const unescaped = str.replace(/\\n/g, '\n');
          serviceAccount = JSON.parse(unescaped);
        } catch (e2) {
          console.error('[FCM] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e1.message);
        }
      }
    } else if (typeof rawEnv === 'object') {
      serviceAccount = rawEnv;
    }
  }

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFirebaseInitialized = true;
      console.log('[FCM] Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT');
      return true;
    } catch (err) {
      console.error('[FCM] Failed to initialize Firebase Admin with service account:', err.message);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      isFirebaseInitialized = true;
      console.log('[FCM] Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
      return true;
    } catch (err) {
      console.error('[FCM] Failed to initialize Firebase Admin with default credentials:', err.message);
    }
  } else {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT environment variable is not set on backend');
  }

  return isFirebaseInitialized;
}

// Try initializing immediately on module import
initFirebaseAdmin();

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

export async function sendPushNotification(userId, { title, message, type, link, sticky, ongoing }) {
  try {
    const user = await User.findById(userId).select('fcmToken name');
    if (!user?.fcmToken) {
      console.log(`[FCM] Skip push to user ${userId} (${user?.name || 'Unknown'}): No FCM token registered in DB`);
      return;
    }

    if (!isFirebaseInitialized) {
      initFirebaseAdmin();
    }

    if (isFirebaseInitialized) {
      const response = await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: title || 'Business Sarthi',
          body: message || ''
        },
        data: {
          title: title || 'Business Sarthi',
          message: message || '',
          type: type || '',
          link: link || '',
          sticky: String(sticky || false),
          ongoing: String(ongoing || false)
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'bs_alerts',
            sound: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            visibility: 'public'
          }
        }
      });
      console.log(`[FCM] Notification successfully sent to ${user.name || userId} [MsgID: ${response}]`);
    } else {
      console.log(`[FCM] Cannot send push to ${user.name || userId} (Firebase Admin not initialized on server): ${title} - ${message}`);
    }
  } catch (err) {
    console.error(`[FCM] Send failed for user ${userId}:`, err.message);
    if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token') {
      console.log(`[FCM] Clearing invalid token for user ${userId}`);
      await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } }).catch(() => {});
    }
  }
}

export async function notifyMany(recipients, payload) {
  return Promise.all(recipients.map((r) => notify({ ...payload, recipient: r })));
}
