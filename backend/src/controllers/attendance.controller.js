import { Attendance, AttendanceRequest, LocationLog, Company, Branch, Shift, User, CurrentStaffLocation } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { realtime } from '../sockets/index.js';
import { todayStr, getNepalMinutes } from '../utils/dates.js';
import { getDistanceMeters } from '../utils/geo.js';
import { LOCATION_SOURCES } from '../constants/location.js';

import { reverseGeocode } from '../utils/geocoder.js';
import { checkAttendanceRestriction } from '../utils/attendance-checks.js';
import { uploadFile } from '../services/storage.service.js';

/** POST /attendance/check-in */
export const checkIn = asyncHandler(async (req, res) => {
  const companyId = req.user.company?._id;
  if (!companyId) throw ApiError.forbidden('No company associated');

  const date = todayStr();

  // 0. Check for off-days, holidays, or leaves
  const restriction = await checkAttendanceRestriction(req.user, date);
  if (restriction.restricted) {
    throw ApiError.forbidden(restriction.reason + ' Regular check-in is disabled. Please submit an attendance request if you are working overtime.');
  }

  const existing = await Attendance.findOne({ staff: req.user._id, date });
  if (existing?.checkIn?.time) throw ApiError.conflict('Already checked in today');

  const { latitude, longitude, deviceInfo, photo } = req.body;

  // Selfie is mandatory for all check-ins
  if (!photo) throw ApiError.badRequest('Selfie is mandatory for check-in');

  // Outdoor staff cannot check-in from web
  const isAppRequest = !!deviceInfo?.platform && (deviceInfo.platform.toLowerCase() === 'android' || deviceInfo.platform.toLowerCase() === 'ios');
  if (req.user.workMode === 'OUTDOOR' && !isAppRequest) {
    throw ApiError.forbidden('Outdoor staff can only check in via the mobile application.');
  }

  // 1. Check radius for indoor users
  if (req.user.workMode === 'INDOOR') {
    if (latitude == null || longitude == null) {
      throw ApiError.badRequest('GPS location is required for indoor staff check-in.');
    }

    let targetLoc = null;
    let radius = 200;

    if (req.user.branch) {
      const branch = await Branch.findById(req.user.branch);
      if (branch) {
        targetLoc = branch.location?.coordinates;
        radius = branch.radius || 200;
      }
    }

    if (!targetLoc) {
      const company = await Company.findById(companyId);
      if (company?.location?.coordinates?.length === 2) {
        targetLoc = company.location.coordinates;
        radius = company.checkInRadiusMeters || 200;
      }
    }

    if (targetLoc && targetLoc.length === 2) {
      const dist = getDistanceMeters(latitude, longitude, targetLoc[1], targetLoc[0]);
      if (dist > radius) {
        throw ApiError.forbidden(`Indoor Staff: You must be within ${radius}m of your assigned branch/office to check in. Current distance: ${Math.round(dist)}m.`);
      }
    } else {
      // Fallback: If no location is set for branch/company, we can't enforce radius
      console.warn(`Radius enforcement failed for user ${req.user._id}: No target location defined for branch or company.`);
    }
  }

  const now = new Date();
  const address = await reverseGeocode(latitude, longitude);
  let photoUrl = null;

  try {
    photoUrl = await uploadFile(photo, 'attendance/check-in', 'image/jpeg');
  } catch (err) {
    throw ApiError.badRequest('Failed to process check-in photo');
  }

  // 2. Shift Window Restriction (1 hour prior until shift end)
  if (req.user.shift) {
    const shift = req.user.shift.startTime ? req.user.shift : await Shift.findById(req.user.shift).lean();
    if (shift) {
      const nowNepal = getNepalMinutes();
      const [sh, sm] = shift.startTime.split(':').map(Number);
      const [eh, em] = shift.endTime.split(':').map(Number);


      const shiftStartMins = sh * 60 + sm;
      let shiftEndMins = eh * 60 + em;

      // Handle shifts crossing midnight
      if (shiftEndMins < shiftStartMins) shiftEndMins += 1440;

      const oneHourPrior = shiftStartMins - 60;

      // Check if current time is within [start-60, end]
      // Note: If shift crosses midnight, and we are in the "late" part of it (after midnight),
      // nowNepal might be small (e.g. 1 AM = 60).
      // We check both current day and "previous day shift carryover" logic if needed,
      // but usually check-in happens around the start time.
      const isWithinWindow = (nowNepal >= oneHourPrior && nowNepal <= shiftEndMins) ||
                             (nowNepal + 1440 >= oneHourPrior && nowNepal + 1440 <= shiftEndMins);

      if (!isWithinWindow) {
        throw ApiError.badRequest(`Check-in not allowed yet. Your shift is from ${shift.startTime} to ${shift.endTime}. You can check in from 1 hour prior until the shift ends.`);
      }
    }
  }

  // Late detection from shift settings (Requirement: Check-In > StartTime + Buffer)
  let isLate = false;
  if (req.user.shift) {
    const shift = req.user.shift.startTime ? req.user.shift : await Shift.findById(req.user.shift).lean();
    if (shift) {
      const [sh, sm] = shift.startTime.split(':').map(Number);

      const buffer = shift.bufferTime || 0;

      // Current time in Nepal
      const nowMins = getNepalMinutes(now);
      const shiftStartPlusBuffer = sh * 60 + sm + buffer;

      if (nowMins > shiftStartPlusBuffer) {
        isLate = true;
      }
    }
  } else {
    // Fallback to company settings if no specific shift
    const settings = req.user.company.settings || {};
    const [h, m] = (settings.workStartTime || '09:00').split(':').map(Number);
    const startToday = new Date(now);
    startToday.setHours(h, m + (settings.lateGraceMinutes || 15), 0, 0);
    isLate = now > startToday;
  }

  const attendance = await Attendance.findOneAndUpdate(
    { staff: req.user._id, date },
    {
      $set: {
        company: companyId,
        'checkIn.time': now,
        'checkIn.location': latitude != null ? { type: 'Point', coordinates: [longitude, latitude] } : undefined,
        'checkIn.address': address,
        'checkIn.photo': photoUrl,
        'checkIn.deviceInfo': deviceInfo,
        'checkIn.isLate': isLate,
        status: isLate ? 'LATE' : 'PRESENT',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (latitude != null) {
    const point = {
      staff: req.user._id, company: companyId,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      address,
      deviceInfo, source: LOCATION_SOURCES.CHECKIN, recordedAt: now,
      receivedAt: now
    };

    LocationLog.create(point).catch(() => {});

    // Get company package for interval calculation
    const company = await Company.findById(companyId).populate('package');
    const intervalMs = (company?.package?.trackingIntervalMinutes || 60) * 60000;

    // Update CurrentState for the live dashboard AND align tracking interval
    CurrentStaffLocation.findOneAndUpdate(
      { staff: req.user._id },
      { $set: {
          location: point.location,
          address,
          recordedAt: now,
          receivedAt: now,
          source: point.source,
          lastStoredAt: now,
          nextAllowedAt: new Date(now.getTime() + intervalMs), // Align next background ping
          company: companyId
      } },
      { upsert: true }
    ).catch(() => {});

    // Realtime: broadcast check-in location immediately
    realtime.staffLocation(companyId.toString(), {
      staffId: req.user._id.toString(),
      staffName: req.user.name,
      position: req.user.position || 'Staff',
      profilePhoto: req.user.profilePhoto,
      lat: latitude,
      lng: longitude,
      address,
      accuracy: 0,
      recordedAt: now,
    });
  }

  audit({ req, action: 'CHECK_IN', entity: 'Attendance', entityId: attendance._id, meta: { isLate } });
  realtime.dashboard(companyId.toString(), { event: 'check_in', staffId: req.user._id });
  realtime.activity(companyId.toString(), { text: `${req.user.name} checked in${isLate ? ' (late)' : ''}`, at: now });

  // Shift Notification (Sticky)
  realtime.notify(req.user._id.toString(), {
    title: 'Your shift is Active',
    message: 'Tracking is active. Please check out at the end of your shift.',
    type: 'SHIFT_ACTIVE',
    sticky: true,
    ongoing: true
  });

  res.status(201).json({ success: true, data: { attendance } });
});

/** POST /attendance/check-out */
export const checkOut = asyncHandler(async (req, res) => {
  const date = todayStr();
  const attendance = await Attendance.findOne({ staff: req.user._id, date });
  if (!attendance?.checkIn?.time) throw ApiError.badRequest('You have not checked in today');
  if (attendance.checkOut?.time) throw ApiError.conflict('Already checked out today');

  const { latitude, longitude, deviceInfo, auto, reason, photo } = req.body;

  // Selfie is mandatory for all check-outs (unless it's an auto-checkout)
  if (!auto && !photo) throw ApiError.badRequest('Selfie is mandatory for check-out');

  // Outdoor staff cannot check-out from web unless it's an auto-checkout
  const isAppRequest = !!deviceInfo?.platform && (deviceInfo.platform.toLowerCase() === 'android' || deviceInfo.platform.toLowerCase() === 'ios');
  if (!auto && req.user.workMode === 'OUTDOOR' && !isAppRequest) {
    throw ApiError.forbidden('Outdoor staff can only check out via the mobile application.');
  }

  const now = new Date();
  const address = latitude != null ? await reverseGeocode(latitude, longitude) : (auto ? 'System Auto Checkout' : 'Location Unknown');
  let photoUrl = null;

  if (!auto && photo) {
    try {
      photoUrl = await uploadFile(photo, 'attendance/check-out', 'image/jpeg');
    } catch (err) {
      throw ApiError.badRequest('Failed to process check-out photo');
    }
  }

  attendance.checkOut = {
    time: now,
    location: latitude != null ? { type: 'Point', coordinates: [longitude, latitude] } : undefined,
    address,
    photo: photoUrl,
    deviceInfo,
  };

  if (auto) {
    attendance.remarks = reason || 'Auto-checkout by system';
  }

  attendance.workedMinutes = Math.round((now - attendance.checkIn.time) / 60000);

  // Requirement: If working hour is less than 40% of shift hour mark as half day
  let thresholdMinutes = 192; // Default 40% of 8 hours (3.2 hours) fallback

  if (req.user.shift) {
    const shift = req.user.shift.startTime ? req.user.shift : await Shift.findById(req.user.shift).lean();
    if (shift) {
      const [sh, sm] = shift.startTime.split(':').map(Number);

      const [eh, em] = shift.endTime.split(':').map(Number);

      let startMins = sh * 60 + sm;
      let endMins = eh * 60 + em;

      if (endMins < startMins) endMins += 1440; // Crosses midnight

      const totalShiftMinutes = endMins - startMins;
      thresholdMinutes = Math.floor(totalShiftMinutes * 0.4); // 40% threshold
    }
  }

  if (attendance.workedMinutes < thresholdMinutes) {
    attendance.status = 'HALF_DAY';
  } else {
    attendance.status = 'PRESENT';
  }

  await attendance.save();

  if (latitude != null) {
    const point = {
      staff: req.user._id, company: req.user.company._id,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      address,
      deviceInfo, source: LOCATION_SOURCES.CHECKOUT, recordedAt: now,
      receivedAt: now
    };

    LocationLog.create(point).catch(() => {});

    // Clear tracking state / Align next allowed (though background tracking should stop)
    CurrentStaffLocation.findOneAndUpdate(
      { staff: req.user._id },
      { $set: {
          location: point.location,
          address,
          recordedAt: now,
          receivedAt: now,
          source: point.source,
          lastStoredAt: now,
          nextAllowedAt: null, // Reset for next shift
          company: req.user.company._id
      } },
      { upsert: true }
    ).catch(() => {});

    // Realtime: broadcast final checkout location
    realtime.staffLocation(req.user.company._id.toString(), {
      staffId: req.user._id.toString(),
      staffName: req.user.name,
      position: req.user.position || 'Staff',
      profilePhoto: req.user.profilePhoto,
      lat: latitude,
      lng: longitude,
      address,
      accuracy: 0,
      recordedAt: now,
    });
  }

  audit({ req, action: 'CHECK_OUT', entity: 'Attendance', entityId: attendance._id });
  realtime.dashboard(req.user.company._id.toString(), { event: 'check_out', staffId: req.user._id });

  // Clear Shift Notification
  realtime.notify(req.user._id.toString(), {
    type: 'SHIFT_INACTIVE',
    clearSticky: true
  });

  res.json({ success: true, data: { attendance } });
});

/** GET /attendance/me?month=YYYY-MM&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD */
export const myAttendance = asyncHandler(async (req, res) => {
  const date = todayStr();
  const filter = { staff: req.user._id };

  if (req.query.fromDate && req.query.toDate) {
    filter.date = { $gte: req.query.fromDate, $lte: req.query.toDate };
  } else {
    const month = req.query.month || todayStr().slice(0, 7);
    filter.date = { $regex: `^${month}` };
  }

  const [items, restriction] = await Promise.all([
    Attendance.find(filter).sort('-date'),
    checkAttendanceRestriction(req.user, date)
  ]);

  const lateDays = items.filter((a) => a.checkIn?.isLate).length;
  const presentDays = items.filter((a) => ['PRESENT', 'HALF_DAY'].includes(a.status)).length;
  const today = items.find((a) => a.date === date);

  // We return the period name based on what was requested
  const summaryMonth = req.query.month || (req.query.fromDate ? `${req.query.fromDate} to ${req.query.toDate}` : todayStr().slice(0, 7));

  res.json({
    success: true,
    data: { items, summary: { month: summaryMonth, presentDays, lateDays }, today: today || null, restriction },
  });
});

/** GET /attendance?date=&staffId=&month= (owner/manager/admin) */
export const listAttendance = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.companyId) filter.company = req.companyId;
  if (req.query.staffId) filter.staff = req.query.staffId;
  if (req.query.date) filter.date = req.query.date;
  else if (req.query.month) filter.date = { $regex: `^${req.query.month}` };

  const [items, total] = await Promise.all([
    Attendance.find(filter).populate('staff', 'name position profilePhoto')
      .sort('-date').skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);
  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

/** POST /attendance/requests */
export const createAttendanceRequest = asyncHandler(async (req, res) => {
  const { date, checkInTime, checkOutTime, reason } = req.body;
  if (!date || !checkInTime || !checkOutTime || !reason) {
    throw ApiError.badRequest('Missing required fields');
  }

  // Ensure checkOut is after checkIn
  if (new Date(checkOutTime) <= new Date(checkInTime)) {
    throw ApiError.badRequest('Check-out time must be after check-in time');
  }

  // Check if attendance already exists for this date
  const existing = await Attendance.findOne({ staff: req.user._id, date });
  if (existing?.checkIn?.time) {
    throw ApiError.conflict('Attendance already exists for this date');
  }

  const request = await AttendanceRequest.create({
    staff: req.user._id,
    company: req.user.company._id,
    date,
    checkInTime,
    checkOutTime,
    reason,
  });

  audit({ req, action: 'CREATE_ATTENDANCE_REQUEST', entity: 'AttendanceRequest', entityId: request._id });

  // Notify admin/owner
  realtime.notify(req.user.company._id.toString(), {
    title: 'New Attendance Request',
    message: `${req.user.name} has requested attendance for ${date} (Overtime/Off-day)`,
    type: 'ATTENDANCE_REQUEST',
    link: '/company/attendance' // Assuming this is where they manage it
  });

  res.status(201).json({ success: true, data: { request } });
});

/** GET /attendance/requests/me */
export const myAttendanceRequests = asyncHandler(async (req, res) => {
  const requests = await AttendanceRequest.find({ staff: req.user._id }).sort('-createdAt');
  res.json({ success: true, data: { requests } });
});

/** GET /attendance/requests (admin/owner) */
export const listAttendanceRequests = asyncHandler(async (req, res) => {
  const filter = { company: req.companyId };
  if (req.query.status) filter.status = req.query.status;

  const requests = await AttendanceRequest.find(filter)
    .populate('staff', 'name position profilePhoto')
    .sort('-createdAt');

  res.json({ success: true, data: { requests } });
});

/** PATCH /attendance/requests/:id/review */
export const reviewAttendanceRequest = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }

  const request = await AttendanceRequest.findById(req.params.id).populate('staff');
  if (!request) throw ApiError.notFound('Request not found');
  if (request.status !== 'PENDING') throw ApiError.badRequest('Request already reviewed');

  request.status = status;
  request.reviewNote = reviewNote;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();

  if (status === 'APPROVED') {
    // Create actual attendance record
    const workedMinutes = Math.round((new Date(request.checkOutTime) - new Date(request.checkInTime)) / 60000);

    await Attendance.findOneAndUpdate(
      { staff: request.staff._id, date: request.date },
      {
        company: request.company,
        staff: request.staff._id,
        date: request.date,
        'checkIn.time': request.checkInTime,
        'checkIn.address': 'Approved Request',
        'checkOut.time': request.checkOutTime,
        'checkOut.address': 'Approved Request',
        workedMinutes,
        status: 'PRESENT', // Approved overtime counts as Present
      },
      { upsert: true, new: true }
    );
  }

  await request.save();

  audit({ req, action: 'REVIEW_ATTENDANCE_REQUEST', entity: 'AttendanceRequest', entityId: request._id, meta: { status } });

  // Notify staff
  realtime.notify(request.staff._id.toString(), {
    title: `Attendance Request ${status}`,
    message: `Your attendance request for ${request.date} has been ${status.toLowerCase()}.`,
    type: 'ATTENDANCE_REVIEW',
    link: '/staff/attendance'
  });

  res.json({ success: true, data: { request } });
});
