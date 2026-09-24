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
export async function notify({ recipient, company, type, title, message, link, data = {}, sticky = false, ongoing = false }) {
  try {
    const CRITICAL_TYPES = [
      'PAYROLL_GENERATED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'SYSTEM_ALERT',
      'CHAT_MESSAGE', 'COMPLAINT_NEW', 'COMPLAINT_REPLY', 'SHIFT_ACTIVE', 'SHIFT_INACTIVE', 'ANNOUNCEMENT'
    ];

    const isCritical = CRITICAL_TYPES.includes(type);

    const targetUserId = (recipient && typeof recipient === 'object' && recipient._id)
      ? recipient._id.toString()
      : recipient?.toString();

    if (!targetUserId) {
      console.warn('[NOTIFY SKIP] No valid targetUserId provided for notification:', { type, title });
      return null;
    }

    console.log(`[NOTIFY] Dispatching type=${type} to targetUserId=${targetUserId} (isCritical=${isCritical})`);

    if (!isCritical) {
       const activeAtt = await Attendance.findOne({
          staff: targetUserId,
          date: todayStr(),
          'checkIn.time': { $exists: true },
          'checkOut.time': { $exists: false }
       }).select('_id').lean();

       if (!activeAtt) {
          console.log(`[NOTIFY SKIP PUSH] User ${targetUserId} not checked in today for non-critical type ${type}`);
          return await Notification.create({ recipient: targetUserId, company, type, title, message, link });
       }
    }

    const n = await Notification.create({ recipient: targetUserId, company, type, title, message, link });

    // Socket.IO for real-time app users
    realtime.notify(targetUserId, { ...n.toObject(), sticky, ongoing });

    // FCM for background/killed app notifications
    sendPushNotification(targetUserId, { title, message, type, link, data, sticky, ongoing });

    return n;
  } catch (e) {
    console.error('[NOTIFY ERROR] notification failed:', e.message);
    return null;
  }
}

export async function sendPushNotification(userId, { title, message, type, link, data = {}, sticky, ongoing }) {
  try {
    const user = await User.findById(userId).select('fcmToken name');
    if (!user?.fcmToken) {
      console.warn(`[FCM SKIP] User ${userId} (${user?.name || 'Unknown'}): No FCM token registered in DB`);
      return;
    }

    if (!isFirebaseInitialized) {
      initFirebaseAdmin();
    }

    if (isFirebaseInitialized) {
      // Sanitize data dictionary so every value is string (FCM requirement)
      const sanitizedData = {
        title: String(title || 'Business Sarthi'),
        message: String(message || ''),
        type: String(type || ''),
        link: String(link || ''),
        sticky: String(sticky || false),
        ongoing: String(ongoing || false)
      };

      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          sanitizedData[k] = String(v ?? '');
        }
      }

      const response = await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: title || 'Business Sarthi',
          body: message || ''
        },
        data: sanitizedData,
        android: {
          priority: 'high',
          notification: {
            channelId: 'bs_alerts',
            sound: 'default',
            priority: 'PRIORITY_HIGH',
            defaultSound: true,
            defaultVibrateTimings: true,
            visibility: 'public'
          }
        }
      });
      console.log(`[FCM SUCCESS] Push sent to ${user.name} (${userId}) [MsgID: ${response}]`);
    } else {
      console.warn(`[FCM WARN] Cannot send push to ${user?.name || userId} (Firebase Admin not initialized on server)`);
    }
  } catch (err) {
    console.error(`[FCM ERROR] Send failed for user ${userId}:`, err.message);
    if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token') {
      console.log(`[FCM CLEANUP] Clearing invalid token for user ${userId}`);
      await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } }).catch(() => {});
    }
  }
}

export async function notifyMany(recipients, payload) {
  return Promise.all(recipients.map((r) => notify({ ...payload, recipient: r })));
}
