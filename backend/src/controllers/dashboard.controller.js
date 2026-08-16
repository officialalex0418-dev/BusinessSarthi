import mongoose from 'mongoose';
import {
  Company, User, Package, Attendance, Sale, SalesInvoice,
  LocationLog, AuditLog, Leave, Holiday, Target
} from '../models/index.js';
import { asyncHandler } from '../utils/ApiError.js';
import { todayStr } from '../utils/dates.js';
import { adToBs } from '../utils/nepaliDate.js';
import { statsCache } from '../utils/cache.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

/** GET /dashboard/super — Super Admin dashboard */
export const superDashboard = asyncHandler(async (_req, res) => {
  const cachedData = statsCache.get('super_dashboard');
  if (cachedData) return res.json({ success: true, data: cachedData });

  const today = todayStr();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

  const [
    totalCompanies, companiesToday, totalStaff, activeStaff,
    checkedInToday, activePackages, packages, recentActivities,
    trackingPingsToday,
  ] = await Promise.all([
    Company.countDocuments({}),
    Company.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }),
    User.countDocuments({ role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true }),
    Attendance.countDocuments({ date: today, 'checkIn.time': { $exists: true } }),
    Package.countDocuments({ status: 'ACTIVE' }),
    Package.find({ status: 'ACTIVE' }).lean(),
    AuditLog.find({}).populate('user', 'name role').sort('-createdAt').limit(15).lean(),
    LocationLog.countDocuments({ recordedAt: { $gte: startOfToday } }),
  ]);

  // Revenue estimate = sum of package price × companies on it
  const revenueAgg = await Company.aggregate([
    { $match: { status: 'ACTIVE', package: { $ne: null } } },
    { $lookup: { from: 'packages', localField: 'package', foreignField: '_id', as: 'pkg' } },
    { $unwind: '$pkg' },
    { $group: { _id: null, monthlyRevenue: { $sum: '$pkg.price' } } },
  ]);

  const dashboardData = {
    totalCompanies,
    companiesToday,
    totalStaff,
    activeStaff,
    checkedInToday,
    monthlyRevenue: revenueAgg[0]?.monthlyRevenue || 0,
    activePackages,
    packages,
    trackingPingsToday,
    recentActivities,
  };

  statsCache.set('super_dashboard', dashboardData, 60); // 1 minute cache

  res.json({
    success: true,
    data: dashboardData,
  });
});

/** GET /dashboard/company — Company owner / manager dashboard */
export const companyDashboard = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const cachedData = statsCache.get(`company_dashboard:${companyId}`);
  if (cachedData) return res.json({ success: true, data: cachedData });

  const today = todayStr();
  const month = today.slice(0, 7);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    company, totalStaff, activeStaff, checkedInToday, monthlyAttendance,
    dailySalesAgg, monthlySalesAgg, salesGraph, recentActivities, pendingLeaves,
  ] = await Promise.all([
    Company.findById(companyId).populate('package', 'name').lean(),
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }),
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true }),
    Attendance.countDocuments({ company: companyId, date: today, 'checkIn.time': { $exists: true } }),
    Attendance.countDocuments({ company: companyId, date: { $regex: `^${month}` }, status: { $in: ['PRESENT', 'HALF_DAY'] } }),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', total: 1, _id: 0 } },
    ]),
    AuditLog.find({ company: companyId }).populate('user', 'name').sort('-createdAt').limit(15).lean(),
    Leave.countDocuments({ company: companyId, status: 'PENDING' }),
  ]);

  const dashboardData = {
    company,
    totalStaff, activeStaff, checkedInToday, monthlyAttendance,
    dailySales: dailySalesAgg[0]?.total || 0,
    monthlySales: monthlySalesAgg[0]?.total || 0,
    salesGraph,
    pendingLeaves,
    recentActivities,
  };

  statsCache.set(`company_dashboard:${companyId}`, dashboardData, 30); // 30 seconds cache

  res.json({
    success: true,
    data: dashboardData,
  });
});


/** GET /dashboard/staff — Staff app dashboard */
export const staffDashboard = asyncHandler(async (req, res) => {
  const userId = oid(req.user._id);
  const cachedData = statsCache.get(`staff_dashboard:${userId}`);
  if (cachedData) return res.json({ success: true, data: cachedData });

  const companyId = req.user.company?._id;
  const today = todayStr();
  const month = today.slice(0, 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const dateFormat = req.user.company?.settings?.dateFormat || 'AD';
  let targetMonth = month;
  if (dateFormat === 'BS') {
    const bs = adToBs(new Date());
    targetMonth = `${bs.year}-${String(bs.month).padStart(2, '0')}`;
  }

  const [
    todayAttendance, monthAttendance, salesAgg,
    monthlyTarget, upcomingHolidays, recentLeaves
  ] = await Promise.all([
    Attendance.findOne({ staff: userId, date: today }).lean(),
    Attendance.find({ staff: userId, date: { $regex: `^${month}` } }).lean(),
    Sale.aggregate([
      { $match: { staff: userId, saleDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Target.findOne({ staff: userId, month: targetMonth, calendarType: dateFormat }).lean(),
    Holiday.find({ company: companyId, startDate: { $gte: new Date() } })
      .sort('startDate').limit(5).lean(),
    Leave.find({ staff: userId }).sort('-createdAt').limit(5).lean(),
  ]);

  const lateDays = monthAttendance.filter((a) => a.checkIn?.isLate).length;
  const presentDays = monthAttendance.filter((a) => ['PRESENT', 'HALF_DAY'].includes(a.status)).length;

  const achieved = salesAgg[0]?.total || 0;
  const target = monthlyTarget?.amount || 0;

  const dashboardData = {
    profile: {
      name: req.user.name,
      position: req.user.position,
      designationName: req.user.designation?.name || req.user.position || 'Staff',
      profilePhoto: req.user.profilePhoto,
      company: req.user.company?.name,
      email: req.user.email,
      phone: req.user.phone,
      department: req.user.designation?.department?.name || '—',
    },
    checkInStatus: !!todayAttendance?.checkIn?.time,
    checkOutStatus: !!todayAttendance?.checkOut?.time,
    checkInTime: todayAttendance?.checkIn?.time || null,
    checkOutTime: todayAttendance?.checkOut?.time || null,
    leaveBalance: req.user.leaveBalance,
    lateDays,
    presentDays,
    monthlyTarget: target,
    achievedTarget: achieved,
    remainingTarget: Math.max(target - achieved, 0),
    salesProgressPct: target ? Math.min(Math.round((achieved / target) * 100), 100) : 0,
    attendanceProgressPct: Math.min(Math.round((presentDays / 26) * 100), 100),
    upcomingHolidays,
    recentLeaves,
  };

  statsCache.set(`staff_dashboard:${userId}`, dashboardData, 60); // 1 minute cache

  res.json({
    success: true,
    data: dashboardData,
  });
});
