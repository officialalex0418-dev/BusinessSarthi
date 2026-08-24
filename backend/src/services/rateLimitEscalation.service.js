import { RateLimit, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

/**
 * Handles escalated rate limiting for OTP verification.
 * Stage 1: 3 failures -> 15 min block (IP)
 * Stage 2: 3 more failures -> 1 hour block (IP)
 * Stage 3: 3 more failures -> Account Deactivation (User)
 */
export const checkOtpRateLimit = async (ip, email) => {
  const limit = await RateLimit.findOne({ ip, type: 'OTP_VERIFY' });

  if (limit && limit.blockExpiresAt && limit.blockExpiresAt > new Date()) {
    const remaining = Math.ceil((limit.blockExpiresAt - new Date()) / 1000 / 60);
    throw ApiError.forbidden(`Too many failed attempts. This IP is blocked for ${remaining} more minutes.`);
  }

  // Also check if user account is active
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user && !user.isActive) {
    throw ApiError.forbidden('Account is deactivated. Please contact an administrator.');
  }

  return limit;
};

export const recordOtpFailure = async (ip, email, req) => {
  let limit = await RateLimit.findOne({ ip, type: 'OTP_VERIFY' });

  if (!limit) {
    limit = new RateLimit({ ip, type: 'OTP_VERIFY', failedAttempts: 0, stage: 1 });
  }

  // If previous block expired, we continue tracking
  if (limit.blockExpiresAt && limit.blockExpiresAt <= new Date()) {
      // Don't reset failedAttempts here because we want to count 3 MORE attempts
      // The requirement says "grant 3 additional attempts"
  }

  limit.failedAttempts += 1;
  limit.lastAttemptAt = new Date();

  let message = 'Invalid OTP';

  if (limit.failedAttempts % 3 === 0) {
    const stage = Math.floor(limit.failedAttempts / 3);

    if (stage === 1) {
      limit.blockExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      limit.stage = 2;
      message = 'Too many failed attempts. This IP is blocked for 15 minutes.';
      audit({ req, action: 'IP_BLOCKED_15M', entity: 'RateLimit', meta: { ip } });
    } else if (stage === 2) {
      limit.blockExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      limit.stage = 3;
      message = 'Too many failed attempts. This IP is blocked for 1 hour.';
      audit({ req, action: 'IP_BLOCKED_1H', entity: 'RateLimit', meta: { ip } });
    } else if (stage >= 3) {
      // Deactivate account
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.isActive = false;
        await user.save({ validateBeforeSave: false });
        audit({ req, user: user._id, action: 'ACCOUNT_DEACTIVATED_OTP_FAILURES', entity: 'Auth' });
      }
      limit.blockExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Block IP indefinitely (1 year)
      message = 'Account has been deactivated due to multiple failed OTP attempts.';
    }
  }

  await limit.save();
  return message;
};

export const resetOtpRateLimit = async (ip) => {
  await RateLimit.deleteOne({ ip, type: 'OTP_VERIFY' });
};
