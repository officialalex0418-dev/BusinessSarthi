import crypto from 'crypto';
import { User, Company, Package, LocationLog, Attendance, Leave, Sale, Payroll, Notification, Designation, Stockist } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { emails } from '../services/email.service.js';
import { realtime } from '../sockets/index.js';
import { ROLES, ADMIN_EMPLOYEE_SUBROLES } from '../constants/roles.js';
import { authCache } from '../utils/cache.js';

/**
 * Staff & system-employee management.
 * - Company owner/manager manage STAFF + COMPANY_MANAGER within their company.
 * - Super admin manages everything incl. ADMIN_EMPLOYEE (system employees).
 */

/** GET /staff?companyId=&role=&search= */
export const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.companyId) {
    filter.$or = [{ company: req.companyId }, { stockist: req.companyId }];
  } else if (req.query.scope === 'system') {
    filter.role = ROLES.ADMIN_EMPLOYEE;
  }

  if (req.query.role) filter.role = req.query.role;
  if (req.query.active) filter.isActive = req.query.active === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('company', 'name')
      .populate('stockist', 'name')
      .populate('designation')
      .populate('branch', 'name')
      .populate('shift')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: paginatedResponse(items.map((u) => u.toSafeJSON()), total, page, limit) });
});

/** POST /staff */
export const createStaff = asyncHandler(async (req, res) => {
  const {
    name, email, phone, address, pan, position,
    basicSalary, dailyAllowance, allowances, role, designation, shift, companyId, monthlyTarget, workMode, branch,
    allowedMobileCount, allowedWebCount, profilePhoto
  } = req.body;

  if (await User.findOne({ email })) throw ApiError.conflict('Email already in use');

  let targetCompany = null;
  let targetStockist = null;
  let targetRole = role || ROLES.STAFF;

  if (designation) {
    const des = await Designation.findById(designation);
    if (des) targetRole = des.baseRole;
  }

  let finalSalary = basicSalary;
  let finalAllowance = dailyAllowance;
  let finalAllowances = allowances;

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPLOYEE].includes(req.user.role)) {
    if (targetRole === ROLES.ADMIN_EMPLOYEE) {
      finalSalary = 0;
      finalAllowance = 0;
      finalAllowances = 0;
    } else {
      targetCompany = companyId;
      if (!targetCompany) throw ApiError.badRequest('companyId required for company staff');
    }
  } else {
    if (req.user.role === 'STOCKIST' || req.user.stockist) {
      targetStockist = req.user.stockist?._id || req.companyId;
    } else {
      targetCompany = req.user.company?._id || req.companyId;
    }
    if (![ROLES.STAFF, ROLES.COMPANY_MANAGER].includes(targetRole)) {
      throw ApiError.forbidden('You can only create STAFF or COMPANY_MANAGER accounts');
    }
  }

  const limitEntityId = targetCompany || targetStockist;
  if (limitEntityId) {
    let org = await Company.findById(limitEntityId).populate('package');
    if (!org) {
      org = await Stockist.findById(limitEntityId).populate('package');
    }
    if (org && org.package) {
      const count = await User.countDocuments({
        $or: [{ company: limitEntityId }, { stockist: limitEntityId }],
        role: { $in: [ROLES.STAFF, ROLES.COMPANY_MANAGER] },
        isActive: true
      });
      if (count >= org.package.maxStaff) {
        throw ApiError.forbidden(`Staff limit reached (${org.package.maxStaff}). Upgrade your package.`);
      }
    }
  }

  let finalPhoto = profilePhoto || null;
  if (profilePhoto && profilePhoto.startsWith('data:')) {
    const { uploadFile } = await import('../services/storage.service.js');
    finalPhoto = await uploadFile(profilePhoto, 'profiles');
  }

  const tempPassword = crypto.randomBytes(6).toString('base64url');
  const user = await User.create({
    name, email, phone, address, pan, position,
    basicSalary: finalSalary, dailyAllowance: finalAllowance, allowances: finalAllowances, monthlyTarget,
    role: targetRole,
    designation: designation || null,
    shift: shift || null,
    company: targetCompany,
    stockist: targetStockist,
    workMode: workMode || 'OUTDOOR',
    branch: branch || null,
    allowedMobileCount: allowedMobileCount || 1,
    allowedWebCount: allowedWebCount || 1,
    password: tempPassword,
    needsPasswordChange: true,
    profilePhoto: finalPhoto,
  });

  const orgName = targetCompany ? (await Company.findById(targetCompany))?.name : (await Stockist.findById(targetStockist))?.name;
  if (orgName) {
    emails.staffCreated(email, { name, companyName: orgName, tempPassword });
    const notifyId = (targetCompany || targetStockist).toString();
    realtime.dashboard(notifyId, { event: 'staff_created' });
    realtime.activity(notifyId, { text: `${name} added as ${position || targetRole}`, at: new Date() });
  }

  audit({ req, action: 'CREATE_STAFF', entity: 'User', entityId: user._id, meta: { role: targetRole } });
  res.status(201).json({ success: true, data: { user: user.toSafeJSON() } });
});

/** GET /staff/:id */
export const getStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('company', 'name')
    .populate('stockist', 'name')
    .populate('designation')
    .populate('shift');
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

/** PATCH /staff/:id */
export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  const {
    name, phone, address, pan, position,
    basicSalary, dailyAllowance, allowances, designation, shift, isActive, monthlyTarget, workMode, branch,
    allowedMobileCount, allowedWebCount, profilePhoto
  } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (pan !== undefined) user.pan = pan;
  if (position !== undefined) user.position = position;
  if (basicSalary !== undefined) user.basicSalary = basicSalary;
  if (dailyAllowance !== undefined) user.dailyAllowance = dailyAllowance;
  if (allowances !== undefined) user.allowances = allowances;
  if (designation !== undefined) {
    user.designation = designation || null;
    const des = await Designation.findById(designation);
    if (des) user.role = des.baseRole;
  }
  if (shift !== undefined) user.shift = shift || null;
  if (isActive !== undefined) user.isActive = isActive;
  if (monthlyTarget !== undefined) user.monthlyTarget = monthlyTarget;
  if (workMode !== undefined) user.workMode = workMode;
  if (branch !== undefined) user.branch = branch === 'MAIN' ? null : branch;
  if (allowedMobileCount !== undefined) user.allowedMobileCount = allowedMobileCount;
  if (allowedWebCount !== undefined) user.allowedWebCount = allowedWebCount;

  if (profilePhoto !== undefined) {
    if (profilePhoto && profilePhoto.startsWith('data:')) {
      const { uploadFile } = await import('../services/storage.service.js');
      user.profilePhoto = await uploadFile(profilePhoto, 'profiles');
    } else {
      user.profilePhoto = profilePhoto;
    }
  }

  await user.save();
  authCache.del(user._id.toString());

  audit({ req, action: 'UPDATE_STAFF', entity: 'User', entityId: user._id });
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const authorizeDeviceReset = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.isDeviceResetAuthorized = true;
  user.deviceResetRequested = false;
  user.primaryDeviceId = null;
  user.deviceInfo = null;
  await user.save();
  authCache.del(user._id.toString());
  res.json({ success: true, message: 'Device reset authorized successfully' });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = false;
  await user.save();
  authCache.del(user._id.toString());
  audit({ req, action: 'DELETE_STAFF', entity: 'User', entityId: user._id });
  res.json({ success: true, message: 'Staff deactivated successfully' });
});

export const hardDeleteStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  await User.findByIdAndDelete(req.params.id);
  authCache.delete(user._id.toString());
  audit({ req, action: 'HARD_DELETE_STAFF', entity: 'User', entityId: user._id });
  res.json({ success: true, message: 'Staff permanently deleted successfully' });
});
