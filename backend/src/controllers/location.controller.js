import mongoose from 'mongoose';
import { LocationLog, CurrentStaffLocation, User, Attendance } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { realtime } from '../sockets/index.js';
import { rangeFromPeriod, todayStr } from '../utils/dates.js';
import { LOCATION_SOURCES, PERSISTENT_LOCATION_SOURCES } from '../constants/location.js';

import { reverseGeocode } from '../utils/geocoder.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/**
 * POST /locations — staff device pushes a location ping
 * Body: { latitude, longitude, accuracy, batteryLevel, deviceInfo, recordedAt, source }
 * Supports batch: { pings: [...] } for offline-queued points.
 */
export const pushLocation = asyncHandler(async (req, res) => {
  const staffId = req.user._id;
  const companyId = req.user.company?._id || req.user.company;
  const serverNow = new Date();

  // 1. Validate Payload
  const incoming = req.body.pings || [req.body];
  if (!incoming.length) throw ApiError.badRequest('No pings provided');

  // Sort by recordedAt to process chronologically
  incoming.sort((a, b) => new Date(a.recordedAt || 0) - new Date(b.recordedAt || 0));

  // 2. Validate Staff/Company/Tracking Permissions
  const staff = await User.findOne({ _id: staffId, company: companyId, isActive: true }).populate('company');
  if (!staff) throw ApiError.unauthorized('User is inactive or no longer belongs to the company');

  if (!staff.trackingEnabled) {
    throw ApiError.forbidden('Tracking is disabled for this user');
  }

  const company = staff.company;
  if (!company || company.status !== 'ACTIVE') {
    throw ApiError.forbidden('Company is not active');
  }

  if (!company.package?.features?.employeeTracking) {
    throw ApiError.forbidden('Employee tracking is not enabled for your company package');
  }

  // 3. Attendance Status (Cached for this request)
  const attendance = await Attendance.findOne({
    staff: staffId,
    date: todayStr(),
    'checkIn.time': { $exists: true },
    'checkOut.time': { $exists: false }
  });
  const isCheckedIn = !!attendance;

  const packageIntervalMs = (company.package?.trackingIntervalMinutes || 60) * 60000;

  const logsToPersist = [];
  let lastProcessedPoint = null;

  for (const p of incoming) {
    const { latitude, longitude, accuracy, batteryLevel, source, recordedAt } = p;
    const pTime = recordedAt ? new Date(recordedAt) : serverNow;

    // 4. Strict Coordinate Validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;
    if (accuracy != null && accuracy < 0) continue;

    lastProcessedPoint = {
      lat: latitude,
      lng: longitude,
      accuracy,
      batteryLevel,
      source,
      recordedAt: pTime,
      receivedAt: serverNow
    };

    // 5. LIVE TRACKING: Update current state and broadcast for EVERY valid ping
    // This is the "Live" purpose - where is the employee RIGHT NOW.
    await CurrentStaffLocation.findOneAndUpdate(
      { staff: staffId },
      { $set: {
          location: { type: 'Point', coordinates: [longitude, latitude] },
          accuracy,
          batteryLevel,
          recordedAt: pTime,
          receivedAt: serverNow,
          source,
          company: companyId
      } },
      { upsert: true }
    );

    realtime.staffLocation(companyId.toString(), {
      staffId: staffId.toString(),
      staffName: staff.name,
      position: staff.position || 'Staff',
      profilePhoto: staff.profilePhoto,
      ...lastProcessedPoint
    });

    // 6. HISTORICAL TRACKING: Determine if this point should be persisted to MongoDB
    // Decision must be atomic to prevent concurrent request duplicates.
    if (isCheckedIn && source !== 'LIVE_REFRESH') {
      const isSpecial = ['CHECKIN', 'CHECKOUT', 'MANUAL'].includes(source);

      let shouldPersist = false;

      if (isSpecial) {
        shouldPersist = true;
      } else {
        // Atomic Interval Enforcement: Reserve the slot
        const state = await CurrentStaffLocation.findOneAndUpdate(
          {
            staff: staffId,
            $or: [
              { nextAllowedAt: { $lte: pTime } },
              { nextAllowedAt: { $exists: false } },
              { nextAllowedAt: null }
            ]
          },
          { $set: { nextAllowedAt: new Date(pTime.getTime() + packageIntervalMs) } },
          { new: true }
        );

        if (state) {
          shouldPersist = true;
        }
      }

      if (shouldPersist) {
        let address = p.address;
        if (!address && isSpecial) {
          address = await reverseGeocode(latitude, longitude);
        }

        logsToPersist.push({
          staff: staffId,
          company: companyId,
          location: { type: 'Point', coordinates: [longitude, latitude] },
          address,
          accuracy,
          batteryLevel,
          deviceInfo: p.deviceInfo,
          recordedAt: pTime,
          receivedAt: serverNow,
          source: isSpecial ? source : 'BACKGROUND',
        });

        // Update lastStoredAt for UI status logic
        await CurrentStaffLocation.updateOne(
          { staff: staffId },
          { $set: { lastStoredAt: pTime } }
        );
      }
    }
  }

  if (logsToPersist.length > 0) {
    await LocationLog.insertMany(logsToPersist, { ordered: false });
  }

  res.status(201).json({
    success: true,
    saved: logsToPersist.length,
    live: !!lastProcessedPoint
  });
});

/** GET /locations/interval — staff app asks how often to ping (from company package) */
export const getTrackingConfig = asyncHandler(async (req, res) => {
  const pkg = req.companyPackage;
  const interval = pkg?.trackingIntervalMinutes || 60;
  res.json({
    success: true,
    data: {
      enabled: !!pkg?.features?.employeeTracking,
      // Throttling: Mobile app should send at the package interval, not every minute
      intervalMinutes: interval,
      packageInterval: interval,
    },
  });
});

/** GET /locations/live — latest location per active staff (owner/manager/admin) */
export const liveLocations = asyncHandler(async (req, res) => {
  const companyMatch = req.companyId ? { company: new mongoose.Types.ObjectId(req.companyId) } : {};

  // 1. Find staff who are currently checked in (look back 48h)
  const activeAttendance = await Attendance.find({
    ...companyMatch,
    'checkIn.time': { $exists: true },
    'checkOut.time': { $exists: false },
    createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
  }).populate('staff', 'name position profilePhoto');

  if (!activeAttendance.length) {
    return res.json({ success: true, data: { items: [] } });
  }

  const staffIds = activeAttendance.filter(a => a.staff).map(a => a.staff._id);

  // 2. Fetch current state from optimized collection (instead of aggregation on logs)
  const states = await CurrentStaffLocation.find({ staff: { $in: staffIds } }).lean();
  const stateMap = new Map(states.map(s => [s.staff.toString(), s]));

  // Get company package for dynamic status calculation
  const companyDoc = await mongoose.model('Company').findById(req.companyId).populate('package');
  const interval = companyDoc?.package?.trackingIntervalMinutes || 60;

  const items = activeAttendance.filter(a => a.staff).map(a => {
    const s = a.staff;
    const state = stateMap.get(s._id.toString());
    const recordedAt = state?.recordedAt || a.checkIn?.time;

    // Calculate status relative to package interval (as per audit report recommendation)
    // LIVE (< 2m), ON_SCHEDULE (<= 1.25x interval), DELAYED (<= 2x interval), STALE
    let locationStatus = 'STALE';
    if (recordedAt) {
      const diffMin = (Date.now() - new Date(recordedAt)) / 60000;
      if (diffMin < 2) locationStatus = 'LIVE';
      else if (diffMin <= interval * 1.25) locationStatus = 'ON_SCHEDULE';
      else if (diffMin <= interval * 2) locationStatus = 'DELAYED';
    }

    return {
      staffId: s._id.toString(),
      name: s.name,
      position: s.position || 'Staff',
      profilePhoto: s.profilePhoto,
      lat: state?.location?.coordinates?.[1] || a.checkIn?.location?.coordinates?.[1],
      lng: state?.location?.coordinates?.[0] || a.checkIn?.location?.coordinates?.[0],
      accuracy: state?.accuracy || 0,
      batteryLevel: state?.batteryLevel,
      recordedAt,
      receivedAt: state?.receivedAt || a.checkIn?.time,
      locationStatus,
      source: state?.source,
      checkInTime: a.checkIn?.time,
      lastRefreshRequestedAt: state?.lastRefreshRequestedAt,
    };
  }).filter(i => i.lat != null);

  res.json({ success: true, data: { items } });
});

/** GET /locations/history/:staffId?from=&to=&period= — route history / playback */
export const routeHistory = asyncHandler(async (req, res) => {
  const staff = await User.findById(req.params.staffId);
  if (!staff) throw ApiError.notFound('Staff not found');
  assertScope(req, staff);

  let from, to;
  if (req.query.period) {
    const range = rangeFromPeriod(req.query.period);
    from = range.start;
    to = range.end;
  } else {
    from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 3600 * 1000);
    to = req.query.to ? new Date(req.query.to) : new Date();
  }

  const [logs, attendance] = await Promise.all([
    LocationLog.find({
      staff: staff._id,
      recordedAt: { $gte: from, $lte: to },
    }).sort('recordedAt').limit(5000).lean(),
    Attendance.find({
      staff: staff._id,
      date: {
        $gte: from.toISOString().split('T')[0],
        $lte: to.toISOString().split('T')[0]
      }
    }).sort('date').lean()
  ]);

  const attMap = new Map(attendance.map((a) => [a.date, a]));

  // Filter logs to only include those between check-in and check-out for each day
  const filteredPoints = logs.filter((log) => {
    const logDate = log.recordedAt.toISOString().split('T')[0];
    const dailyAttendance = attMap.get(logDate);

    if (!dailyAttendance || !dailyAttendance.checkIn?.time) return false;

    const checkInTime = new Date(dailyAttendance.checkIn.time);
    const checkOutTime = dailyAttendance.checkOut?.time
      ? new Date(dailyAttendance.checkOut.time)
      : logDate === new Date().toISOString().split('T')[0]
      ? new Date()
      : new Date(new Date(logDate).setHours(23, 59, 59, 999));

    return log.recordedAt >= checkInTime && log.recordedAt <= checkOutTime;
  });

  res.json({
    success: true,
    data: {
      staff: { id: staff._id, name: staff.name },
      points: filteredPoints.map((l) => ({
        lat: l.location.coordinates[1],
        lng: l.location.coordinates[0],
        address: l.address,
        accuracy: l.accuracy,
        recordedAt: l.recordedAt,
        receivedAt: l.receivedAt,
        source: l.source,
      })),
      attendance: attendance.map(a => ({
        date: a.date,
        checkIn: a.checkIn?.location?.coordinates ? {
          lat: a.checkIn.location.coordinates[1],
          lng: a.checkIn.location.coordinates[0],
          address: a.checkIn.address,
          time: a.checkIn.time
        } : null,
        checkOut: a.checkOut?.location?.coordinates ? {
          lat: a.checkOut.location.coordinates[1],
          lng: a.checkOut.location.coordinates[0],
          address: a.checkOut.address,
          time: a.checkOut.time
        } : null
      })),
      packageInterval: staff.company ? (await mongoose.model('Company').findById(staff.company).populate('package'))?.package?.trackingIntervalMinutes || 60 : 60
    },
  });
});

/** GET /locations/heatmap?period=daily|weekly|monthly — movement heatmap data */
export const heatmap = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromPeriod(req.query.period || 'weekly');
  const match = { recordedAt: { $gte: start, $lte: end } };

  if (req.companyId) match.company = toObjectId(req.companyId);
  if (req.query.staffId) match.staff = toObjectId(req.query.staffId);

  // Geographic Aggregation: Bucket points into a 4-decimal grid (~11m cells)
  // This is significantly more scalable than returning raw points.
  const points = await LocationLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 4] },
          lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 4] }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        lat: '$_id.lat',
        lng: '$_id.lng',
        count: 1
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10000 }
  ]);

  res.json({ success: true, data: { points } });
});

/** POST /locations/request-refresh (manager/owner) — ask active staff to ping NOW */
export const requestRefresh = asyncHandler(async (req, res) => {
  const companyId = req.user.company?._id || req.user.company;
  if (!companyId) throw ApiError.forbidden('No company associated');

  const { staffId } = req.body;
  const COOLDOWN_MS = 20000; // 20-second server-side cooldown per staff

  if (staffId) {
    // 1. Cooldown Check
    const state = await CurrentStaffLocation.findOne({ staff: staffId });
    if (state?.lastRefreshRequestedAt && (Date.now() - state.lastRefreshRequestedAt < COOLDOWN_MS)) {
       return res.status(429).json({ success: false, message: 'Please wait before requesting another refresh for this staff.' });
    }

    // 2. Refresh specific user
    const staff = await User.findById(staffId);
    if (!staff || staff.company?.toString() !== companyId.toString()) {
       throw ApiError.notFound('Staff not found in your company');
    }

    await CurrentStaffLocation.updateOne({ staff: staffId }, { $set: { lastRefreshRequestedAt: new Date() } });
    realtime.requestRefresh(staffId);
  } else {
    // Refresh all active staff in company
    const today = todayStr();
    const activeAttendance = await Attendance.find({
      company: companyId,
      date: today,
      'checkIn.time': { $exists: true },
      'checkOut.time': { $exists: false },
    }).select('staff');

    const now = new Date();
    activeAttendance.forEach(a => {
      const sId = a.staff.toString();
      realtime.requestRefresh(sId);
      CurrentStaffLocation.updateOne({ staff: sId }, { $set: { lastRefreshRequestedAt: now } }).catch(() => {});
    });
  }

  res.json({ success: true, message: 'Refresh request sent to active staff' });
});

/** GET /locations/analysis/:staffId?period= — movement stats (distance, pings, active hours) */
export const movementAnalysis = asyncHandler(async (req, res) => {
  const staff = await User.findById(req.params.staffId);
  if (!staff) throw ApiError.notFound('Staff not found');
  assertScope(req, staff);

  const { start, end } = rangeFromPeriod(req.query.period || 'daily');
  const logs = await LocationLog.find({ staff: staff._id, recordedAt: { $gte: start, $lte: end } })
    .sort('recordedAt').lean();

  let distanceKm = 0;
  for (let i = 1; i < logs.length; i++) {
    distanceKm += haversine(
      logs[i - 1].location.coordinates[1], logs[i - 1].location.coordinates[0],
      logs[i].location.coordinates[1], logs[i].location.coordinates[0]
    );
  }

  res.json({
    success: true,
    data: {
      staff: { id: staff._id, name: staff.name },
      period: req.query.period || 'daily',
      totalPings: logs.length,
      distanceKm: Math.round(distanceKm * 100) / 100,
      firstPing: logs[0]?.recordedAt || null,
      lastPing: logs[logs.length - 1]?.recordedAt || null,
    },
  });
});

// ---------- helpers ----------
function assertScope(req, staff) {
  if (['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(req.user.role)) return;
  if (staff.company?.toString() !== req.user.company?._id?.toString()) {
    throw ApiError.forbidden('Staff outside your company');
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
