import mongoose from 'mongoose';
import LocationLog from '../models/LocationLog.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { realtime } from '../sockets/index.js';
import { rangeFromPeriod, todayStr } from '../utils/dates.js';

import { reverseGeocode } from '../utils/geocoder.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/**
 * POST /locations — staff device pushes a location ping
 * Body: { latitude, longitude, accuracy, batteryLevel, deviceInfo, recordedAt, source }
 * Supports batch: { pings: [...] } for offline-queued points.
 */
export const pushLocation = asyncHandler(async (req, res) => {
  const companyId = req.user.company?._id;
  if (!companyId) throw ApiError.forbidden('No company associated');

  // Only track STAFF while they are checked in
  if (req.user.role === 'STAFF') {
    const today = todayStr();
    const activeAtt = await Attendance.findOne({
      staff: req.user._id,
      date: today,
      'checkIn.time': { $exists: true },
      'checkOut.time': { $exists: false }
    });

    if (!activeAtt) {
      return res.status(200).json({
        success: true,
        data: { saved: 0 },
        message: 'Tracking inactive: Please check-in first'
      });
    }
  }

  const pings = req.body.pings || [req.body];

  // Geocode points selectively: Always geocode CHECKIN/CHECKOUT and the first point in a batch
  // To avoid hitting API limits with 1-minute tracking.
  const docs = await Promise.all(pings.map(async (p, index) => {
    let address = p.address;
    if (!address && (p.source === 'CHECKIN' || p.source === 'CHECKOUT' || index === 0)) {
      address = await reverseGeocode(p.latitude, p.longitude);
    }

    return {
      staff: req.user._id,
      company: companyId,
      location: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      address,
      accuracy: p.accuracy,
      batteryLevel: p.batteryLevel,
      deviceInfo: p.deviceInfo,
      recordedAt: p.recordedAt ? new Date(p.recordedAt) : new Date(),
      source: p.source || 'BACKGROUND',
    };
  }));

  const saved = await LocationLog.insertMany(docs, { ordered: false });

  // Realtime: broadcast latest point to company + platform dashboards
  const latest = saved[saved.length - 1];
  realtime.staffLocation(companyId.toString(), {
    staffId: req.user._id.toString(),
    staffName: req.user.name,
    position: req.user.position || 'Staff',
    profilePhoto: req.user.profilePhoto,
    lat: latest.location.coordinates[1],
    lng: latest.location.coordinates[0],
    address: latest.address,
    accuracy: latest.accuracy,
    recordedAt: latest.recordedAt,
  });

  res.status(201).json({ success: true, data: { saved: saved.length } });
});

/** GET /locations/interval — staff app asks how often to ping (from company package) */
export const getTrackingConfig = asyncHandler(async (req, res) => {
  const pkg = req.companyPackage; // set by requireFeature middleware
  res.json({
    success: true,
    data: {
      enabled: !!pkg?.features?.employeeTracking,
      // Track every minute to create smooth routes
      intervalMinutes: 1,
      // Provide the package interval for marker logic
      packageInterval: pkg?.trackingIntervalMinutes || 60,
    },
  });
});

/** GET /locations/live — latest location per active staff (owner/manager/admin) */
export const liveLocations = asyncHandler(async (req, res) => {
  const companyMatch = req.companyId ? { company: toObjectId(req.companyId) } : {};
  const today = todayStr();

  // 1. Find staff who are checked in today and haven't checked out
  const activeAttendance = await Attendance.find({
    ...companyMatch,
    date: today,
    'checkIn.time': { $exists: true },
    'checkOut.time': { $exists: false },
  }).populate('staff', 'name position profilePhoto');

  if (!activeAttendance.length) {
    return res.json({ success: true, data: { items: [] } });
  }

  const activeStaffIds = activeAttendance.map((a) => a.staff._id);

  // 2. Get latest location logs for these staff members from the last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await LocationLog.aggregate([
    { $match: {
        ...companyMatch,
        staff: { $in: activeStaffIds },
        recordedAt: { $gte: since }
    } },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: '$staff', doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
  ]);

  const logMap = Object.fromEntries(logs.map(l => [l.staff.toString(), l]));

  // 3. Merge: If no recent log, use the Check-In location from Attendance
  const items = activeAttendance.map(a => {
    const s = a.staff;
    const latestLog = logMap[s._id.toString()];

    // Use Log if available, otherwise use Check-In coordinates
    const lat = latestLog ? latestLog.location.coordinates[1] : a.checkIn?.location?.coordinates?.[1];
    const lng = latestLog ? latestLog.location.coordinates[0] : a.checkIn?.location?.coordinates?.[0];
    const recordedAt = latestLog ? latestLog.recordedAt : a.checkIn?.time;

    return {
      staffId: s._id.toString(),
      name: s.name,
      position: s.position || 'Staff',
      profilePhoto: s.profilePhoto,
      lat,
      lng,
      accuracy: latestLog?.accuracy || 0,
      batteryLevel: latestLog?.batteryLevel,
      recordedAt,
      checkInTime: a.checkIn?.time,
    };
  }).filter(i => i.lat != null); // Only show those with at least check-in GPS

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

  // Filter logs to only include those between check-in and check-out for each day
  const filteredPoints = logs.filter(log => {
    const logDate = log.recordedAt.toISOString().split('T')[0];
    const dailyAttendance = attendance.find(a => a.date === logDate);

    if (!dailyAttendance || !dailyAttendance.checkIn?.time) return false;

    const checkInTime = new Date(dailyAttendance.checkIn.time);
    const checkOutTime = dailyAttendance.checkOut?.time
      ? new Date(dailyAttendance.checkOut.time)
      : (logDate === new Date().toISOString().split('T')[0] ? new Date() : new Date(new Date(logDate).setHours(23, 59, 59, 999)));

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

  const points = await LocationLog.aggregate([
    { $match: match },
    { $sample: { size: 10000 } }, // increased sample size for better heatmap accuracy
    {
      $project: {
        _id: 0,
        lat: { $arrayElemAt: ['$location.coordinates', 1] },
        lng: { $arrayElemAt: ['$location.coordinates', 0] },
      },
    },
  ]);
  res.json({ success: true, data: { points } });
});

/** POST /locations/request-refresh (manager/owner) — ask active staff to ping NOW */
export const requestRefresh = asyncHandler(async (req, res) => {
  const companyId = req.user.company?._id;
  if (!companyId) throw ApiError.forbidden('No company associated');

  const { staffId } = req.body;

  if (staffId) {
    // Refresh specific user
    const staff = await User.findById(staffId);
    if (!staff || staff.company?.toString() !== companyId.toString()) {
       throw ApiError.notFound('Staff not found in your company');
    }
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

    activeAttendance.forEach(a => {
      realtime.requestRefresh(a.staff.toString());
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
