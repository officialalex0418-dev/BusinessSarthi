import mongoose from 'mongoose';
import { LocationLog, CurrentStaffLocation, User, Attendance } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { realtime } from '../sockets/index.js';
import { rangeFromPeriod, todayStr } from '../utils/dates.js';
import { LOCATION_SOURCES, PERSISTENT_LOCATION_SOURCES } from '../constants/location.js';
import { authCache, companyCache } from '../utils/cache.js';

import { reverseGeocode } from '../utils/geocoder.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/**
 * POST /locations — staff device pushes a location ping
 * Body: { latitude, longitude, accuracy, batteryLevel, deviceInfo, recordedAt, source }
 */
export const pushLocation = asyncHandler(async (req, res) => {
  const staffId = req.user._id;
  const companyId = req.user.company?._id || req.user.company;
  const serverNow = new Date();

  const { latitude, longitude, accuracy, batteryLevel, source, recordedAt } = req.body;
  const pTime = recordedAt ? new Date(recordedAt) : serverNow;

  // 1. Strict Coordinate Validation
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(201).json({ success: true, saved: 0 });
  }

  // 2. LIVE BROADCAST (Zero DB for live tracking)
  realtime.staffLocation(companyId.toString(), {
    staffId: staffId.toString(),
    staffName: req.user.name,
    position: req.user.position || 'Staff',
    profilePhoto: req.user.profilePhoto,
    lat: latitude, lng: longitude, accuracy, batteryLevel,
    recordedAt: pTime,
    source
  });

  // 3. PERSISTENT TRACKING: Only on specific interval or special events
  const isSpecial = ['CHECKIN', 'CHECKOUT', 'MANUAL'].includes(source);
  const packageIntervalMs = (req.user.company?.package?.trackingIntervalMinutes || 60) * 60000;

  let shouldStore = isSpecial;

  if (!shouldStore) {
    const state = await CurrentStaffLocation.findOne({
      staff: staffId,
      $or: [
        { nextAllowedAt: { $lte: pTime } },
        { nextAllowedAt: { $exists: false } },
        { nextAllowedAt: null }
      ]
    }).select('_id').lean();
    if (state) shouldStore = true;
  }

  if (shouldStore) {
    const point = {
      staff: staffId,
      company: companyId,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      address: isSpecial ? await reverseGeocode(latitude, longitude) : undefined,
      accuracy,
      batteryLevel,
      recordedAt: pTime,
      source: isSpecial ? source : 'BACKGROUND',
    };

    await Promise.all([
      LocationLog.create(point),
      CurrentStaffLocation.updateOne(
        { staff: staffId },
        { $set: { ...point, nextAllowedAt: new Date(pTime.getTime() + packageIntervalMs) } },
        { upsert: true }
      )
    ]);
  }


  res.status(201).json({ success: true, saved: shouldStore ? 1 : 0 });
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

/** GET /locations/history/:staffId?from=&to=&period=&simplify=true — route history / playback */
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

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 1000, 5000);
  const skip = (page - 1) * limit;

  const [logs, attendance, total] = await Promise.all([
    LocationLog.find({
      staff: staff._id,
      recordedAt: { $gte: from, $lte: to },
    }).sort('recordedAt').skip(skip).limit(limit).lean(),
    Attendance.find({
      staff: staff._id,
      date: {
        $gte: from.toISOString().split('T')[0],
        $lte: to.toISOString().split('T')[0]
      }
    }).sort('date').lean(),
    LocationLog.countDocuments({
      staff: staff._id,
      recordedAt: { $gte: from, $lte: to },
    })
  ]);

  const attMap = new Map(attendance.map((a) => [a.date, a]));

  // Filter logs to only include those between check-in and check-out for each day
  let filteredPoints = logs.filter((log) => {
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

  // Simplify route if requested (Simple distance-based reduction)
  if (req.query.simplify === 'true' && filteredPoints.length > 500) {
     const simplified = [];
     const minDistKm = 0.05; // 50m
     let last = null;
     for (const p of filteredPoints) {
        if (!last || haversine(last.location.coordinates[1], last.location.coordinates[0], p.location.coordinates[1], p.location.coordinates[0]) >= minDistKm) {
           simplified.push(p);
           last = p;
        }
     }
     filteredPoints = simplified;
  }

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
        isAnomaly: l.isAnomaly,
        anomalyReason: l.anomalyReason,
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
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      packageInterval: staff.company ? (await mongoose.model('Company').findById(staff.company).populate('package'))?.package?.trackingIntervalMinutes || 60 : 60
    },
  });
});

/** GET /locations/metrics (Super Admin) — tracking health metrics */
export const getTrackingMetrics = asyncHandler(async (req, res) => {
  const lookback = new Date(Date.now() - 24 * 3600 * 1000); // 24h

  const [total, anomalies, sources] = await Promise.all([
    LocationLog.countDocuments({ recordedAt: { $gte: lookback } }),
    LocationLog.countDocuments({ recordedAt: { $gte: lookback }, isAnomaly: true }),
    LocationLog.aggregate([
      { $match: { recordedAt: { $gte: lookback } } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      period: '24h',
      totalPings: total,
      anomalies,
      sources: sources.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
    }
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
