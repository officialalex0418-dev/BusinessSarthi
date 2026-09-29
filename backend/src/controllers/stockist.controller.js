import crypto from 'crypto';
import { Stockist, User, Package } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { emails } from '../services/email.service.js';
import { realtime } from '../sockets/index.js';
import { uploadFile } from '../services/storage.service.js';
import { ROLES } from '../constants/roles.js';

/** GET /stockists (Super Admin) */
export const listStockists = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [items, total] = await Promise.all([
    Stockist.find(filter)
      .populate('package', 'name features')
      .populate('owner', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Stockist.countDocuments(filter),
  ]);
  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

/** POST /stockists (Super Admin) — creates stockist + owner account */
export const createStockist = asyncHandler(async (req, res) => {
  const {
    name, address, panVat, phone, email, logo, packageId, ownerName, ownerEmail,
    location, checkInRadiusMeters, settings, registrationNumber, website, description, additionalInfo
  } = req.body;

  if (await Stockist.findOne({ email })) throw ApiError.conflict('Stockist email already exists');
  if (await User.findOne({ email: ownerEmail })) throw ApiError.conflict('Owner email already in use');

  const pkg = packageId ? await Package.findById(packageId) : null;
  if (packageId && !pkg) throw ApiError.notFound('Package not found');

  let logoUrl = logo;
  if (logo && logo.startsWith('data:')) {
    logoUrl = await uploadFile(logo, 'logos');
  }

  const stockist = await Stockist.create({
    name, address, panVat, phone, email, logo: logoUrl,
    registrationNumber, website, description, additionalInfo,
    package: pkg?._id || null,
    packageAssignedAt: pkg ? new Date() : null,
    location,
    checkInRadiusMeters,
    settings: settings || {}
  });

  const tempPassword = crypto.randomBytes(6).toString('base64url');
  const owner = await User.create({
    name: ownerName,
    email: ownerEmail,
    password: tempPassword,
    role: ROLES.STOCKIST,
    stockist: stockist._id,
    isEmailVerified: false,
    needsPasswordChange: true,
  });

  stockist.owner = owner._id;
  await stockist.save();

  emails.stockistCreated(ownerEmail, { stockistName: name, ownerEmail, tempPassword });
  audit({ req, action: 'CREATE_STOCKIST', entity: 'Stockist', entityId: stockist._id, meta: { name } });
  realtime.dashboard(null, { event: 'stockist_created' });
  realtime.activity(null, { text: `Stockist "${name}" created`, at: new Date() });

  res.status(201).json({ success: true, data: { stockist, owner: owner.toSafeJSON() } });
});

/** GET /stockists/:id */
export const getStockist = asyncHandler(async (req, res) => {
  const stockist = await Stockist.findById(req.params.id)
    .populate('package').populate('owner', 'name email phone');
  if (!stockist) throw ApiError.notFound('Stockist not found');
  res.json({ success: true, data: { stockist } });
});

/** GET /stockists/me — current user's stockist entity */
export const myStockist = asyncHandler(async (req, res) => {
  const stockist = await Stockist.findById(req.user.stockist).populate('package').populate('owner', 'name email phone');
  if (!stockist) throw ApiError.notFound('Stockist not found');
  res.json({ success: true, data: { stockist } });
});

/** PATCH /stockists/me — stockist owner updates own profile details */
export const updateMyStockist = asyncHandler(async (req, res) => {
  if (!req.user.stockist) throw ApiError.forbidden('No stockist associated with this account');

  const updates = (({ name, address, panVat, phone, email, logo, settings, registrationNumber, website, description, additionalInfo, location, checkInRadiusMeters }) =>
    ({ name, address, panVat, phone, email, logo, settings, registrationNumber, website, description, additionalInfo, location, checkInRadiusMeters }))(req.body);

  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

  if (updates.logo && updates.logo.startsWith('data:')) {
    updates.logo = await uploadFile(updates.logo, 'logos');
  }

  const stockistId = req.user.stockist._id || req.user.stockist;
  const stockist = await Stockist.findByIdAndUpdate(stockistId, updates, { new: true, runValidators: true })
    .populate('package').populate('owner', 'name email phone');
  if (!stockist) throw ApiError.notFound('Stockist not found');

  audit({ req, action: 'UPDATE_MY_STOCKIST', entity: 'Stockist', entityId: stockist._id });
  res.json({ success: true, data: { stockist } });
});

/** PATCH /stockists/:id */
export const updateStockist = asyncHandler(async (req, res) => {
  const updates = (({
    name, address, panVat, phone, email, logo, status, settings,
    registrationNumber, website, description, additionalInfo,
    location, checkInRadiusMeters
  }) => ({
    name, address, panVat, phone, email, logo, status, settings,
    registrationNumber, website, description, additionalInfo,
    location, checkInRadiusMeters
  }))(req.body);
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

  if (updates.logo && updates.logo.startsWith('data:')) {
    updates.logo = await uploadFile(updates.logo, 'logos');
  }

  const stockist = await Stockist.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  });
  if (!stockist) throw ApiError.notFound('Stockist not found');

  audit({ req, action: 'UPDATE_STOCKIST', entity: 'Stockist', entityId: stockist._id });
  res.json({ success: true, data: { stockist } });
});

/** DELETE /stockists/:id — soft suspend */
export const deleteStockist = asyncHandler(async (req, res) => {
  const stockist = await Stockist.findByIdAndUpdate(req.params.id, { status: 'SUSPENDED' }, { new: true });
  if (!stockist) throw ApiError.notFound('Stockist not found');
  await User.updateMany({ stockist: stockist._id }, { isActive: false });
  audit({ req, action: 'SUSPEND_STOCKIST', entity: 'Stockist', entityId: stockist._id });
  res.json({ success: true, message: 'Stockist suspended and users deactivated' });
});

/** DELETE /stockists/:id/hard — permanent delete */
export const hardDeleteStockist = asyncHandler(async (req, res) => {
  const stockist = await Stockist.findById(req.params.id);
  if (!stockist) throw ApiError.notFound('Stockist not found');

  const stockistId = stockist._id;

  await Promise.all([
    User.deleteMany({ stockist: stockistId }),
    Stockist.findByIdAndDelete(stockistId),
  ]);

  audit({ req, action: 'HARD_DELETE_STOCKIST', entity: 'Stockist', entityId: stockistId, meta: { name: stockist.name } });
  res.json({ success: true, message: 'Stockist and associated account permanently deleted' });
});
