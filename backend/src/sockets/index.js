import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authCache } from '../utils/cache.js';

/**
 * Socket.io with JWT auth + room-based multi-tenancy.

 * Rooms:
 *   platform            → super admin / admin employees
 *   company:<companyId> → owner + managers of that company
 *   user:<userId>       → personal notifications
 *
 * Client emits:
 *   staff:location { lat, lng, accuracy, ... }  (relayed after REST save — see location.controller)
 */
let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.jwt.accessSecret);

      const { User } = await import('../models/index.js');

      const user = await authCache.getOrSet(`user_socket_auth:${payload.sub}`, async () => {
        return await User.findById(payload.sub).select('isActive authVersion company role').lean();
      }, 60);

      if (!user || !user.isActive) {
        authCache.delete(`user_socket_auth:${payload.sub}`);
        return next(new Error('Account inactive'));
      }


      // authVersion check (Invalidates stale sessions)
      if (payload.v && user.authVersion !== payload.v) {
         return next(new Error('Session expired'));
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
        company: user.company?.toString(),
        name: payload.name
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, company } = socket.user;
    socket.join(`user:${id}`);
    if (role === 'SUPER_ADMIN' || role === 'ADMIN_EMPLOYEE') socket.join('platform');
    if (company && ['COMPANY_OWNER', 'COMPANY_MANAGER'].includes(role)) {
      socket.join(`company:${company}`);
    }

    // Direct Live Refresh Response (Staff -> Server -> Manager)
    socket.on('staff:location:live', async (payload) => {
       const { lat, lng, accuracy, batteryLevel, recordedAt } = payload;
       const serverNow = new Date();

       // 1. Strict Validation
       if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
       if (accuracy != null && accuracy < 0) return;
       if (batteryLevel != null && (batteryLevel < 0 || batteryLevel > 100)) return;

       const { User, Attendance, CurrentStaffLocation } = await import('../models/index.js');
       const { todayStr } = await import('../utils/dates.js');

       // 2. Authorization Check (Real-time account state)
       const u = await authCache.getOrSet(`staff_min:${id}`, async () => {
         return await User.findOne({ _id: id, company: company, isActive: true }).select('name position profilePhoto trackingEnabled').lean();
       }, 300);

       if (!u || !u.trackingEnabled) return;

       // 3. Attendance Check (Live purpose only allowed during shift)
       const attendance = await Attendance.findOne({
          staff: id,
          date: todayStr(),
          'checkIn.time': { $exists: true },
          'checkOut.time': { $exists: false }
       }).select('_id').lean();
       if (!attendance) return;

       // 4. Broadcast to company managers + platform
       if (company) {
          io.to(`company:${company}`).to('platform').emit('location:update', {
             staffId: id,
             staffName: u.name,
             position: u.position || 'Staff',
             profilePhoto: u.profilePhoto,
             lat, lng, accuracy, batteryLevel,
             recordedAt: recordedAt || serverNow,
             receivedAt: serverNow,
             source: 'LIVE_REFRESH'
          });
       }

    });


    socket.on('disconnect', () => {});
  });

  console.log('🔌 Socket.io initialized');
  return io;
}

export function getIO() {
  return io;
}

// ---------- Emit helpers (safe even if io not initialized, e.g. tests) ----------
export const realtime = {
  /** Live staff location → company room + platform room */
  staffLocation(companyId, payload) {
    if (!io) return;
    io.to(`company:${companyId}`).to('platform').emit('location:update', payload);
  },
  /** Dashboard counters changed */
  dashboard(companyId, payload) {
    if (!io) return;
    if (companyId) io.to(`company:${companyId}`).emit('dashboard:update', payload);
    io.to('platform').emit('dashboard:update', { companyId, ...payload });
  },
  /** Personal notification */
  notify(userId, notification) {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification:new', notification);
  },
  /** Activity feed */
  activity(companyId, activity) {
    if (!io) return;
    if (companyId) io.to(`company:${companyId}`).emit('activity:new', activity);
    io.to('platform').emit('activity:new', { companyId, ...activity });
  },
  /** Force specific user device to send a fresh location ping */
  requestRefresh(userId) {
    if (!io) return;
    io.to(`user:${userId}`).emit('location:force_update');
  },
};
