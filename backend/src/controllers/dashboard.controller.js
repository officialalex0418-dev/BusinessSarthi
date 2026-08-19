import mongoose from 'mongoose';
import {
  Company, User, Package, Attendance, Sale, SalesInvoice,
  LocationLog, AuditLog, Leave, Holiday, Target, LeaveType
} from '../models/index.js';

import { asyncHandler } from '../utils/ApiError.js';
import { todayStr, monthStr } from '../utils/dates.js';
import { adToBs, getBsMonthRange } from '../utils/nepaliDate.js';
import { statsCache } from '../utils/cache.js';

const oid = (id) => new mongoose.Types.ObjectId(id);


/** GET /dashboard/super — Super Admin dashboard */
export const superDashboard = asyncHandler(async (_req, res) => {
  const cachedData = statsCache.get('super_dashboard');
  if (cachedData) return res.json({ success: true, data: cachedData });

  const [totalCompanies, totalStaff, activePackages] = await Promise.all([
    Company.countDocuments({}),
    User.countDocuments({ role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }),
    Package.countDocuments({ status: 'ACTIVE' }),
  ]);

  const dashboardData = {
    totalCompanies,
    totalStaff,
    activePackages,
  };

  statsCache.set('super_dashboard', dashboardData, 300); // 5 min cache
  res.json({ success: true, data: dashboardData });
});

/** GET /dashboard/company — Company owner / manager dashboard */
export const companyDashboard = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const cachedData = statsCache.get(`company_dashboard:${companyId}`);
  if (cachedData) return res.json({ success: true, data: cachedData });

  const company = await Company.findById(companyId).populate('package', 'name').lean();
  const dateFormat = company?.settings?.dateFormat || 'AD';

  const now = new Date();
  const today = todayStr();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(yesterday); startOfYesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday); endOfYesterday.setHours(23, 59, 59, 999);

  let startOfMonth, endOfMonth, startOfLastMonth, endOfLastMonth;
  if (dateFormat === 'BS') {
    const bsNow = adToBs(new Date());
    const bsMonth = `${bsNow.year}-${String(bsNow.month).padStart(2, '0')}`;
    const range = getBsMonthRange(bsMonth);
    startOfMonth = range.start;
    endOfMonth = range.end;

    let lmYear = bsNow.year, lmMonth = bsNow.month - 1;
    if (lmMonth === 0) { lmMonth = 12; lmYear--; }
    const lastRange = getBsMonthRange(`${lmYear}-${String(lmMonth).padStart(2, '0')}`);
    startOfLastMonth = lastRange.start;
    endOfLastMonth = lastRange.end;
  } else {
    startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    endOfMonth = new Date(); endOfMonth.setMonth(endOfMonth.getMonth() + 1); endOfMonth.setDate(0); endOfMonth.setHours(23, 59, 59, 999);

    startOfLastMonth = new Date(startOfMonth); startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    endOfLastMonth = new Date(startOfMonth); endOfLastMonth.setDate(0); endOfLastMonth.setHours(23, 59, 59, 999);
  }

  const [
    totalStaff, activeStaff, checkedInToday, onLeaveToday,
    todaySalesAgg, yesterdaySalesAgg, monthlySalesAgg, lastMonthSalesAgg,
    monthlySalesGraph, productSalesAgg, recentActivities
  ] = await Promise.all([
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }),
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true }),
    Attendance.countDocuments({ company: companyId, date: today, 'checkIn.time': { $exists: true } }),
    Attendance.countDocuments({ company: companyId, date: today, status: 'ON_LEAVE' }),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfYesterday, $lte: endOfYesterday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          total: { $sum: '$amount' }
      }},
      { $sort: { _id: 1 } }
    ]),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$productName', total: { $sum: '$amount' }, quantity: { $sum: '$quantity' } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]),
    AuditLog.find({ company: companyId }).populate('user', 'name').sort('-createdAt').limit(10).lean(),
  ]);

  const tSales = todaySalesAgg[0]?.total || 0;
  const ySales = yesterdaySalesAgg[0]?.total || 0;
  const mSales = monthlySalesAgg[0]?.total || 0;
  const lmSales = lastMonthSalesAgg[0]?.total || 0;

  const salesTrend = ySales > 0 ? ((tSales - ySales) / ySales) * 100 : 0;
  const monthlyTrend = lmSales > 0 ? ((mSales - lmSales) / lmSales) * 100 : 0;

  const productTotal = productSalesAgg.reduce((sum, p) => sum + p.total, 0);

  const dashboardData = {
    company,
    totalStaff,
    activeStaff,
    checkedInToday,
    onLeaveToday,
    absentToday: Math.max(totalStaff - checkedInToday - onLeaveToday, 0),
    todaySales: tSales,
    yesterdaySales: ySales,
    salesTrend: Math.round(salesTrend * 10) / 10,
    monthlySales: mSales,
    monthlyTrend: Math.round(monthlyTrend * 10) / 10,
    monthlySalesGraph: monthlySalesGraph.map(i => ({ date: i._id, amount: i.total })),
    productSales: productSalesAgg.map(i => ({
      name: i._id,
      amount: i.total,
      quantity: i.quantity,
      percent: productTotal > 0 ? Math.round((i.total / productTotal) * 100) : 0
    })),
    recentActivities,
  };

  statsCache.set(`company_dashboard:${companyId}`, dashboardData, 60);
  res.json({ success: true, data: dashboardData });
});




/** GET /dashboard/staff — Staff app dashboard */
export const staffDashboard = asyncHandler(async (req, res) => {
  const userId = oid(req.user._id);
  const cachedData = statsCache.get(`staff_dashboard:${userId}`);
  if (cachedData) return res.json({ success: true, data: cachedData });

  const companyId = req.user.company?._id;
  const dateFormat = req.user.company?.settings?.dateFormat || 'AD';
  const today = todayStr();
  const month = today.slice(0, 7);

  let startOfMonth, endOfMonth, targetMonth;

  if (dateFormat === 'BS') {
    const bsNow = adToBs(new Date());
    targetMonth = `${bsNow.year}-${String(bsNow.month).padStart(2, '0')}`;
    const range = getBsMonthRange(targetMonth);
    startOfMonth = range.start;
    endOfMonth = range.end;
  } else {
    targetMonth = month;
    startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    endOfMonth = new Date(startOfMonth); endOfMonth.setMonth(endOfMonth.getMonth() + 1); endOfMonth.setDate(0); endOfMonth.setHours(23, 59, 59, 999);
  }

  const [
    todayAttendance, monthAttendance, salesAgg,
    monthlyTarget, upcomingHolidays, leavesThisMonth,
    leaveConfigs
  ] = await Promise.all([
    Attendance.findOne({ staff: userId, date: today }).lean(),
    // Attendance uses string date (YYYY-MM-DD), range query is safer but regex works too.
    // However, for consistency with calendar type, let's use range if possible or stay with month regex for AD.
    Attendance.find({
      staff: userId,
      date: { $gte: todayStr(startOfMonth), $lte: todayStr(endOfMonth) }
    }).lean(),
    Sale.aggregate([
      { $match: { staff: userId, saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Target.findOne({ staff: userId, month: targetMonth, calendarType: dateFormat }).lean(),
    Holiday.find({ company: companyId, startDate: { $gte: new Date() } })
      .sort('startDate').limit(3).lean(),
    Leave.find({
      staff: userId,
      status: 'APPROVED',
      fromDate: { $gte: startOfMonth, $lte: endOfMonth }
    }).lean(),
    LeaveType.find({ company: companyId }).lean()
  ]);


  const presentDays = monthAttendance.filter((a) => ['PRESENT', 'HALF_DAY'].includes(a.status)).length;
  const leavesTaken = leavesThisMonth.reduce((sum, l) => sum + (l.days || 1), 0);

  // Total allowed leaves per month (average)
  const totalAllowedLeaves = leaveConfigs.reduce((sum, c) => sum + (c.days / 12 || 1), 0);


  const achieved = salesAgg[0]?.total || 0;
  const target = monthlyTarget?.amount || 0;

  // Simple Greeting Logic
  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';

  const dashboardData = {
    profile: {
      name: req.user.name,
      position: req.user.designation?.name || req.user.position || 'Staff',
      company: req.user.company?.name,
      profilePhoto: req.user.profilePhoto,
    },
    greeting,
    checkInStatus: !!todayAttendance?.checkIn?.time,
    checkOutStatus: !!todayAttendance?.checkOut?.time,
    checkInTime: todayAttendance?.checkIn?.time || null,
    checkOutTime: todayAttendance?.checkOut?.time || null,
    stats: {
      leaves: {
        taken: leavesTaken,
        total: Math.round(totalAllowedLeaves),
        remaining: Math.max(Math.round(totalAllowedLeaves) - leavesTaken, 0)
      },
      attendance: {
        present: presentDays,
        totalDays: 26, // Standard working days
        percent: Math.min(Math.round((presentDays / 26) * 100), 100)
      },
      targets: {
        total: target,
        achieved: achieved,
        remaining: Math.max(target - achieved, 0),
        percent: target ? Math.round((achieved / target) * 10000) / 100 : 0
      }
    },
    upcomingHolidays,
  };

  statsCache.set(`staff_dashboard:${userId}`, dashboardData, 60);
  res.json({ success: true, data: dashboardData });
});



