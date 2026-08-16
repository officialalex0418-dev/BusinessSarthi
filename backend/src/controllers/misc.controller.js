import { Notification, AuditLog, Setting, User } from '../models/index.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { uploadFile, deleteFile } from '../services/storage.service.js';
import { authCache, companyCache } from '../utils/cache.js';


// ---------- Notifications ----------


// ---------- Notifications ----------
export const myNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data: { ...paginatedResponse(items, total, page, limit), unreadCount } });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.body.ids?.length) filter._id = { $in: req.body.ids };
  await Notification.updateMany(filter, { isRead: true });
  res.json({ success: true, message: 'Marked as read' });
});

// ---------- Audit Logs (super admin) ----------
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.userId) filter.user = req.query.userId;
  if (req.query.companyId) filter.company = req.query.companyId;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate('user', 'name email role')
      .populate('company', 'name').sort('-createdAt').skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

// ---------- Settings ----------
export const getPublicSettings = asyncHandler(async (req, res) => {
  const cached = companyCache.get('public_settings');
  if (cached) return res.json({ success: true, data: cached });

  const settings = await Setting.findOne({ scope: 'PLATFORM' }).select('branding').lean();
  const data = {
    branding: settings?.branding || {
      appName: 'Business Sarthi',
      logoUrl: '/logo.png',
      tagline: 'Driving Business Forward'
    }
  };
  companyCache.set('public_settings', data, 3600); // 1 hour cache
  res.json({ success: true, data });
});

export const getSettings = asyncHandler(async (req, res) => {
  const scope = ['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(req.user.role)
    ? 'PLATFORM'
    : req.user.company?._id?.toString();
  if (!scope) throw ApiError.badRequest('No settings scope');

  const cached = companyCache.get(`settings:${scope}`);
  if (cached) return res.json({ success: true, data: { settings: cached } });

  let settings = await Setting.findOne({ scope }).lean();
  if (!settings) {
    settings = await Setting.create({ scope });
  }

  companyCache.set(`settings:${scope}`, settings, 300); // 5 minutes cache
  res.json({ success: true, data: { settings } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const scope = ['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(req.user.role)
    ? 'PLATFORM'
    : req.user.company?._id?.toString();
  const allowed = (({ branding, security }) => ({ branding, security }))(req.body);
  Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);

  const settings = await Setting.findOneAndUpdate(
    { scope },
    { $set: allowed },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  companyCache.delete(`settings:${scope}`);
  if (scope === 'PLATFORM') companyCache.delete('public_settings');

  audit({ req, action: 'UPDATE_SETTINGS', entity: 'Setting', entityId: settings._id });
  res.json({ success: true, data: { settings } });
});


// ---------- File Proxy ----------
export const getFile = asyncHandler(async (req, res) => {
  const fileKey = req.params[0]; // Extract key from wildcard '*'

  if (!fileKey) throw ApiError.badRequest('File key is required');

  try {
    const { stream, contentType, contentLength } = await import('../services/storage.service.js').then(m => m.getFileStream(fileKey));

    res.set('Content-Type', contentType);
    if (contentLength) res.set('Content-Length', contentLength);
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    stream.pipe(res);
  } catch (err) {
    logger.error(`File proxy error for ${fileKey}:`, err.message);
    throw ApiError.notFound('File not found');
  }
});

// ---------- Profile (staff self-service) ----------
export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, pan, profilePhoto } = req.body;

  const user = await User.findById(req.user._id).populate({
    path: 'designation',
    populate: { path: 'department', select: 'name' }
  }).populate('company');

  if (!user) throw ApiError.notFound('User not found');

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (pan !== undefined) user.pan = pan;

  if (profilePhoto !== undefined) {
    if (profilePhoto && profilePhoto.startsWith('data:')) {
      try {
        user.profilePhoto = await uploadFile(profilePhoto, 'profiles');
      } catch (uploadErr) {
        console.error('Profile photo upload failed:', uploadErr.message);
        throw ApiError.badRequest('Failed to upload profile photo');
      }
    } else {
      user.profilePhoto = profilePhoto;
    }
  }


  await user.save({ validateBeforeSave: true });
  authCache.delete(`user_ctx:${user._id}`);
  authCache.delete(`user_socket_auth:${user._id}`);

  audit({ req, action: 'UPDATE_PROFILE', entity: 'User', entityId: user._id });
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

