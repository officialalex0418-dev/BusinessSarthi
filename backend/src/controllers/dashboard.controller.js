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

  const [totalStaff, activeStaff, pendingLeaves] = await Promise.all([
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] } }),
    User.countDocuments({ company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true }),
    Leave.countDocuments({ company: companyId, status: 'PENDING' }),
  ]);

  const dashboardData = {
    totalStaff,
    activeStaff,
    pendingLeaves,
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

