import mongoose from 'mongoose';
import {
  Company, User, Package, Attendance, Sale, SalesInvoice,
  LocationLog, AuditLog, Leave, Holiday, Target, LeaveType, Payment, Inventory
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

/** GET /dashboard/company — Company owner / manager / stockist dashboard */
export const companyDashboard = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  if (!companyId) {
    return res.json({
      success: true,
      data: {
        company: req.user.company || req.user.stockist || null,
        totalStaff: 0, activeStaff: 0, checkedInToday: 0, onLeaveToday: 0, absentToday: 0,
        todaySales: 0, yesterdaySales: 0, salesTrend: 0, monthlySales: 0, monthlyTrend: 0,
        todayPayments: 0, monthlyPayments: 0, monthlyProfit: 0,
        monthlySalesGraph: [], productSales: [], recentActivities: []
      }
    });
  }

  const cachedData = statsCache.get(`company_dashboard:${companyId}`);
  if (cachedData) return res.json({ success: true, data: cachedData });

  let company = await Company.findById(companyId).populate('package', 'name').lean();
  if (!company) {
    const { Stockist } = await import('../models/index.js');
    company = await Stockist.findById(companyId).populate('package', 'name').lean();
  }
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

  const compOid = mongoose.Types.ObjectId.isValid(companyId) ? new mongoose.Types.ObjectId(companyId) : companyId;

  const [
    totalStaff, activeStaff, checkedInToday, onLeaveToday,
    todaySalesInvoiceAgg, yesterdaySalesInvoiceAgg, monthlySalesInvoiceAgg, lastMonthSalesInvoiceAgg,
    todayPaymentsAgg, monthlyPaymentsAgg,
    monthlyInvoicesForProfit,
    allInventoryItems,
    monthlySalesGraph, productSalesAgg, recentActivities
  ] = await Promise.all([
    User.countDocuments({ $or: [{ company: companyId }, { stockist: companyId }], role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }).catch(() => 0),
    User.countDocuments({ $or: [{ company: companyId }, { stockist: companyId }], role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true }).catch(() => 0),
    Attendance.countDocuments({ $or: [{ company: companyId }, { stockist: companyId }], date: today, 'checkIn.time': { $exists: true } }).catch(() => 0),
    Attendance.countDocuments({ $or: [{ company: companyId }, { stockist: companyId }], date: today, status: 'ON_LEAVE' }).catch(() => 0),

    // SalesInvoices - Today
    SalesInvoice.aggregate([
      { $match: { company: compOid, saleDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$netTotal', '$totalAmount'] } } } }
    ]).catch(() => []),

    // SalesInvoices - Yesterday
    SalesInvoice.aggregate([
      { $match: { company: compOid, saleDate: { $gte: startOfYesterday, $lte: endOfYesterday } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$netTotal', '$totalAmount'] } } } }
    ]).catch(() => []),

    // SalesInvoices - Monthly
    SalesInvoice.aggregate([
      { $match: { company: compOid, saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$netTotal', '$totalAmount'] } } } }
    ]).catch(() => []),

    // SalesInvoices - Last Month
    SalesInvoice.aggregate([
      { $match: { company: compOid, saleDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$netTotal', '$totalAmount'] } } } }
    ]).catch(() => []),

    // Payments - Today
    Payment.aggregate([
      { $match: { company: compOid, paymentDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).catch(() => []),

    // Payments - Monthly
    Payment.aggregate([
      { $match: { company: compOid, paymentDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).catch(() => []),

    // Monthly Invoices populated with product cost prices for Profit Calculation
    SalesInvoice.find({ company: companyId, saleDate: { $gte: startOfMonth, $lte: endOfMonth } })
      .populate('items.product', 'costPrice sellingPrice price mrp')
      .lean()
      .catch(() => []),

    // Inventory list for fallback cost price lookup
    Inventory.find({ $or: [{ company: companyId }, { stockist: companyId }] })
      .select('_id productName costPrice mrp')
      .lean()
      .catch(() => []),

    // SalesInvoices Monthly Graph
    SalesInvoice.aggregate([
      { $match: { company: compOid, saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          total: { $sum: { $ifNull: ['$netTotal', '$totalAmount'] } }
      }},
      { $sort: { _id: 1 } }
    ]).catch(() => []),

    // Product Sales Performance from SalesInvoice
    SalesInvoice.aggregate([
      { $match: { company: compOid, saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', total: { $sum: '$items.amount' }, quantity: { $sum: '$items.quantity' } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]).catch(() => []),

    AuditLog.find({ $or: [{ company: companyId }, { stockist: companyId }] }).populate('user', 'name').sort('-createdAt').limit(10).lean().catch(() => []),
  ]);

  const tSales = todaySalesInvoiceAgg[0]?.total || 0;
  const ySales = yesterdaySalesInvoiceAgg[0]?.total || 0;
  const mSales = monthlySalesInvoiceAgg[0]?.total || 0;
  const lmSales = lastMonthSalesInvoiceAgg[0]?.total || 0;

  const tPayments = todayPaymentsAgg[0]?.total || 0;
  const mPayments = monthlyPaymentsAgg[0]?.total || 0;

  // Inventory Cost Price Maps for Fallback
  const invMapById = {};
  const invMapByName = {};
  (allInventoryItems || []).forEach(p => {
    if (p._id) invMapById[p._id.toString()] = Number(p.costPrice) || 0;
    if (p.productName) invMapByName[p.productName.trim().toLowerCase()] = Number(p.costPrice) || 0;
  });

  // Monthly Profit calculation: (soldPrice - purchaseCost) * quantity
  let mProfit = 0;
  let mCOGS = 0;
  (monthlyInvoicesForProfit || []).forEach((inv) => {
    let invProfit = 0;
    (inv.items || []).forEach((item) => {
      const soldPrice = Number(item.price) || 0;
      let purchaseCost = Number(item.costPrice || 0);

      if (!purchaseCost && item.product) {
        if (typeof item.product === 'object' && item.product.costPrice) {
          purchaseCost = Number(item.product.costPrice) || 0;
        } else if (invMapById[item.product.toString()]) {
          purchaseCost = invMapById[item.product.toString()];
        }
      }

      if (!purchaseCost && item.productName) {
        const norm = item.productName.trim().toLowerCase();
        if (invMapByName[norm] !== undefined) {
          purchaseCost = invMapByName[norm];
        }
      }

      if (!purchaseCost && item.mrp) {
        purchaseCost = Number(item.mrp) || 0;
      }

      const qty = Number(item.quantity) || 1;
      mCOGS += (purchaseCost * qty);
      invProfit += (soldPrice - purchaseCost) * qty;
    });
    const discount = Number(inv.discountAmount) || 0;
    mProfit += (invProfit - discount);
  });

  const salesTrend = ySales > 0 ? ((tSales - ySales) / ySales) * 100 : 0;
  const monthlyTrend = lmSales > 0 ? ((mSales - lmSales) / lmSales) * 100 : 0;

  const productTotal = productSalesAgg.reduce((sum, p) => sum + (p.total || 0), 0);

  const dashboardData = {
    company: company || { name: 'Stockist Dashboard' },
    totalStaff: totalStaff || 0,
    activeStaff: activeStaff || 0,
    checkedInToday: checkedInToday || 0,
    onLeaveToday: onLeaveToday || 0,
    absentToday: Math.max((totalStaff || 0) - (checkedInToday || 0) - (onLeaveToday || 0), 0),
    todaySales: tSales,
    yesterdaySales: ySales,
    salesTrend: Math.round(salesTrend * 10) / 10,
    monthlySales: mSales,
    monthlyTrend: Math.round(monthlyTrend * 10) / 10,
    todayPayments: tPayments,
    monthlyPayments: mPayments,
    monthlyProfit: Math.round(mProfit * 100) / 100,
    monthlySalesGraph: (monthlySalesGraph || []).map(i => ({ date: i._id, amount: i.total })),
    productSales: (productSalesAgg || []).map(i => ({
      name: i._id || 'Unknown',
      amount: i.total || 0,
      quantity: i.quantity || 0,
      percent: productTotal > 0 ? Math.round(((i.total || 0) / productTotal) * 100) : 0
    })),
    recentActivities: recentActivities || [],
  };

  statsCache.set(`company_dashboard:${companyId}`, dashboardData, 60);
  res.json({ success: true, data: dashboardData });
});

/** GET /dashboard/staff — Staff app dashboard */
export const staffDashboard = asyncHandler(async (req, res) => {
  const userId = oid(req.user._id);
  const cachedData = statsCache.get(`staff_dashboard:${userId}`);
  if (cachedData) return res.json({ success: true, data: cachedData });

  const companyId = req.user.company?._id || req.user.stockist?._id;
  const dateFormat = req.user.company?.settings?.dateFormat || req.user.stockist?.settings?.dateFormat || 'AD';
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
    Attendance.find({
      staff: userId,
      date: { $gte: todayStr(startOfMonth), $lte: todayStr(endOfMonth) }
    }).lean(),
    Sale.aggregate([
      { $match: { staff: userId, saleDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).catch(() => []),
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

  const totalAllowedLeaves = leaveConfigs.reduce((sum, c) => sum + (c.days / 12 || 1), 0);

  const achieved = salesAgg[0]?.total || 0;
  const target = monthlyTarget?.amount || 0;

  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';

  const dashboardData = {
    profile: {
      name: req.user.name,
      position: req.user.designation?.name || req.user.position || 'Staff',
      company: req.user.company?.name || req.user.stockist?.name,
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
        totalDays: 26,
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
