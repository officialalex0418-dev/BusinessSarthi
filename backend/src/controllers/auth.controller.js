import crypto from 'crypto';
import { User, Attendance } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';
import { env } from '../config/env.js';
import { todayStr } from '../utils/dates.js';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  hashToken, persistRefreshToken,
} from '../services/token.service.js';
import { emails } from '../services/email.service.js';
import * as rateLimitEscalation from '../services/rateLimitEscalation.service.js';

const REFRESH_COOKIE = 'bs_refresh';
const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/api/v1/auth',
  maxAge: 3650 * 24 * 60 * 60 * 1000, // 10 years
};

/** POST /auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password, deviceId } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +refreshTokens')
    .populate({
      path: 'company',
      select: 'name status package settings address phone panVat registrationNumber logo website description additionalInfo',
      populate: { path: 'package', select: 'name status features chatRetentionDays' }
    })
    .populate({
      path: 'designation',
      populate: { path: 'department', select: 'name' }
    });

  if (!user || !(await user.comparePassword(password))) {
    audit({ req, user: user?._id, action: 'LOGIN_FAILED', entity: 'Auth', meta: { email }, success: false });
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');
  if (user.company?.status === 'SUSPENDED') throw ApiError.forbidden('Company is suspended');

  // Single device login for APP USERS (Staff & Managers)
  const isAppRequest = !!deviceId;
  if (isAppRequest && ['STAFF', 'COMPANY_MANAGER'].includes(user.role)) {
    const allowedMobile = user.allowedMobileCount || 1;

    if (!user.primaryDeviceId) {
      user.primaryDeviceId = deviceId;
    } else if (user.primaryDeviceId !== deviceId) {
      if (user.isDeviceResetAuthorized) {
        user.primaryDeviceId = deviceId;
        user.isDeviceResetAuthorized = false;
        user.deviceResetRequested = false;
      } else if (allowedMobile === 1) {
        throw ApiError.forbidden(user.deviceResetRequested
          ? 'Device reset request is pending approval.'
          : 'Security: You are already logged in on another device. Please request a device reset from your company administrator to switch devices.');
      }
      // If allowedMobile > 1, we could allow it, but the current logic is Hardware-ID locked to ONE.
      // For now, we stick to the primary ID logic unless explicitly asked to support multiple HW IDs.
    }

    // Force logout other sessions for this user on login if it's a strict single device
    if (allowedMobile === 1) {
      user.refreshTokens = [];
    }
  }

  // Enforce Web Session Limit
  if (!isAppRequest && ['STAFF', 'COMPANY_MANAGER'].includes(user.role)) {
    const allowedWeb = user.allowedWebCount || 1;
    if (user.refreshTokens.filter(t => !t.device || t.device === 'web').length >= allowedWeb) {
      // Clear oldest web session to make room
      const webTokens = user.refreshTokens.filter(t => !t.device || t.device === 'web');
      if (webTokens.length > 0) {
        const oldest = webTokens.sort((a,b) => a.createdAt - b.createdAt)[0];
        user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== oldest.tokenHash);
      }
    }
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, isAppRequest);

  // Optimized: Parallelize token persistence and check-in status check
  const [activeAtt] = await Promise.all([
    Attendance.findOne({
      staff: user._id,
      date: todayStr(),
      'checkIn.time': { $exists: true },
      'checkOut.time': { $exists: false }
    }).select('_id'),
    persistRefreshToken(user, refreshToken, req)
  ]);

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  audit({ req, user: user._id, company: user.company?._id, action: 'LOGIN', entity: 'Auth' });

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
  res.json({
    success: true,
    data: {
        user: { ...user.toSafeJSON(), isCheckedIn: !!activeAtt },
        accessToken,
        refreshToken
    },
  });
});

/** POST /auth/refresh — rotate refresh token */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens').populate({
    path: 'company',
    select: 'name status package settings address phone panVat registrationNumber logo website description additionalInfo',
    populate: { path: 'package', select: 'name status features chatRetentionDays trackingIntervalMinutes' }
  }).populate({
    path: 'designation',
    populate: { path: 'department', select: 'name' }
  });

  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found');


  const tokenHash = hashToken(token);
  const stored = user.refreshTokens?.find((t) => t.tokenHash === tokenHash);
  if (!stored) {
    // Possible token reuse → revoke all sessions
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    audit({ req, user: user._id, action: 'REFRESH_TOKEN_REUSE_DETECTED', entity: 'Auth', success: false });
    throw ApiError.unauthorized('Session invalidated, please login again');
  }

  // rotate
  user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
  const newRefresh = signRefreshToken(user, payload.isMobile);
  await persistRefreshToken(user, newRefresh, req);
  const accessToken = signAccessToken(user);

  res.cookie(REFRESH_COOKIE, newRefresh, cookieOpts);
  res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
});

/** POST /auth/logout */
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.sub).select('+refreshTokens');
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter((t) => t.tokenHash !== hashToken(token));
        await user.save({ validateBeforeSave: false });
        audit({ req, user: user._id, action: 'LOGOUT', entity: 'Auth' });
      }
    } catch { /* ignore */ }
  }
  res.clearCookie(REFRESH_COOKIE, { ...cookieOpts, maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
});

/** POST /auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase();
  console.log(`[AUTH] Forgot password requested for: ${email}`);

  const user = await User.findOne({ email });

  // Always respond 200 to avoid email enumeration
  if (user) {
    const raw = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.clientUrl}/reset-password/${raw}`;
    console.log(`[AUTH] Sending reset link to: ${user.email}`);

    await emails.passwordReset(user.email, { name: user.name, resetUrl });
    audit({ req, user: user._id, action: 'PASSWORD_RESET_REQUESTED', entity: 'Auth' });
  } else {
    console.warn(`[AUTH] Forgot password: User not found for ${email}`);
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

/** GET /auth/verify-reset-token/:token */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('_id');

  if (!user) throw ApiError.badRequest('Reset link is invalid or expired');

  res.json({ success: true, message: 'Token is valid' });
});

/** POST /auth/reset-password/:token — Phase 2: Use token to reset password */
export const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) throw ApiError.badRequest('Reset token is invalid or expired');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // kill all sessions
  await user.save();

  emails.passwordResetSuccess(user.email, { name: user.name });
  audit({ req, user: user._id, action: 'PASSWORD_RESET', entity: 'Auth' });
  res.json({ success: true, message: 'Password updated. Please login again.' });
});

/** GET /auth/verify-email/:token */
export const verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    emailVerifyToken: tokenHash,
    emailVerifyExpires: { $gt: new Date() },
  }).select('+emailVerifyToken +emailVerifyExpires');

  if (!user) throw ApiError.badRequest('Verification link invalid or expired');
  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  audit({ req, user: user._id, action: 'EMAIL_VERIFIED', entity: 'Auth' });
  res.json({ success: true, message: 'Email verified successfully' });
});

/** GET /auth/me */
export const me = asyncHandler(async (req, res) => {
  const today = todayStr();
  const activeAtt = await Attendance.findOne({
    staff: req.user._id,
    date: today,
    'checkIn.time': { $exists: true },
    'checkOut.time': { $exists: false }
  }).select('_id').lean();

  res.json({ success: true, data: { user: { ...req.user.toSafeJSON(), isCheckedIn: !!activeAtt } } });
});


/** PATCH /auth/change-password */
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  user.needsPasswordChange = false;
  user.refreshTokens = [];
  await user.save();
  audit({ req, action: 'PASSWORD_CHANGED', entity: 'Auth' });
  res.json({ success: true, message: 'Password changed. Please login again.' });
});

/** POST /auth/request-device-reset */
export const requestDeviceReset = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.deviceResetRequested = true;
  await user.save({ validateBeforeSave: false });

  // Notify company owners
  const owners = await User.find({ company: user.company, role: 'COMPANY_OWNER', isActive: true });
  for (const owner of owners) {
    emails.deviceResetRequested(owner.email, {
      ownerName: owner.name,
      staffName: user.name,
      staffEmail: user.email
    });
  }

  audit({ req, user: user._id, action: 'DEVICE_RESET_REQUESTED', entity: 'Auth' });
  res.json({ success: true, message: 'Device reset request submitted to your company owner.' });
});

/** PATCH /auth/fcm-token */
export const updateFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest('FCM token is required');

  await User.findByIdAndUpdate(req.user._id, { $set: { fcmToken: token } });

  res.json({ success: true, message: 'FCM token updated successfully' });
});

