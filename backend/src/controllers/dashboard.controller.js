import mongoose from 'mongoose';
import {
  Company, User, Package, Attendance, Sale, SalesInvoice,
  LocationLog, AuditLog, Leave, Holiday, Target
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

  const today = todayStr();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

  let startOfMonth, endOfMonth;
  if (dateFormat === 'BS') {
    const bsNow = adToBs(new Date());
    const bsMonth = `${bsNow.year}-${String(bsNow.month).padStart(2, '0')}`;
    const range = getBsMonthRange(bsMonth);
    startOfMonth = range.start;
    endOfMonth = range.end;
  } else {
    startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    endOfMonth = new Date(); endOfMonth.setMonth(endOfMonth.getMonth() + 1); endOfMonth.setDate(0); endOfMonth.setHours(23, 59, 59, 999);
  }

  const [
    totalStaff, activeStaff, checkedInToday,
    todaySalesAgg, monthlySalesGraph, productSalesAgg, recentActivities
  ] = await Promise.all([
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }),
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true }),
    Attendance.countDocuments({ company: companyId, date: today, 'checkIn.time': { $exists: true } }),
    Sale.aggregate([
      { $match: { company: oid(companyId), saleDate: { $gte: startOfToday } } },
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

  const dashboardData = {
    company,
    totalStaff,
    activeStaff,
    checkedInToday,
    todaySales: todaySalesAgg[0]?.total || 0,
    monthlySalesGraph: monthlySalesGraph.map(i => ({ date: i._id, amount: i.total })),
    productSales: productSalesAgg.map(i => ({ name: i._id, amount: i.total, quantity: i.quantity })),
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

  const dashboardData = {
    profile: {
      name: req.user.name,
      position: req.user.position,
      company: req.user.company?.name,
    },
    leaveBalance: req.user.leaveBalance,
  };

  statsCache.set(`staff_dashboard:${userId}`, dashboardData, 60);
  res.json({ success: true, data: dashboardData });
});

