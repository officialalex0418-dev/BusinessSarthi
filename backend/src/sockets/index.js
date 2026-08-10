import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

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

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.jwt.accessSecret);
      socket.user = {
        id: payload.sub,
        role: payload.role,
        company: payload.company,
        name: payload.name // Ensure name is available from JWT
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

       // Security: Verify user still active and belongs to company
       const { User, Attendance } = await import('../models/index.js');
       const u = await User.findById(id).select('isActive company role');
       if (!u || !u.isActive || u.company?.toString() !== company?.toString()) {
          return socket.disconnect(true);
       }

       // Broadcast to company managers
       if (company) {
          io.to(`company:${company}`).to('platform').emit('location:update', {
             staffId: id,
             staffName: socket.user.name || 'Staff',
             lat, lng, accuracy, batteryLevel,
             recordedAt: recordedAt || new Date(),
             source: 'LIVE_REFRESH'
          });

          // Also update the CurrentStaffLocation for consistency in the "Live" table
          const { CurrentStaffLocation } = await import('../models/index.js');
          await CurrentStaffLocation.findOneAndUpdate(
            { staff: id },
            {
              $set: {
                location: { type: 'Point', coordinates: [lng, lat] },
                accuracy, batteryLevel, recordedAt,
                source: 'LIVE_REFRESH',
                company: company
              }
            },
            { upsert: true }
          ).catch(err => console.error('Socket state update failed', err));
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
