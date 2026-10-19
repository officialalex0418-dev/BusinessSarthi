import crypto from 'crypto';
import { IdempotencyKey } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const withIdempotency = async (req, res, next) => {
  const key = req.headers['x-idempotency-key'];
  if (!key) {
    // If no key is provided, bypass idempotency (optional or enforce it?)
    // Enforcing it ensures frontend *must* send it for safety
    return next(ApiError.badRequest('x-idempotency-key header is required for this operation.'));
  }

  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  const userId = req.user._id;
  const companyId = req.companyId;

  if (!companyId) {
    return next(ApiError.badRequest('Company context required for idempotency.'));
  }

  let idempotencyRecord;

  try {
    // Attempt to create a new idempotency record atomically
    idempotencyRecord = await IdempotencyKey.create({
      key,
      user: userId,
      company: companyId,
      requestPath: req.path,
      requestMethod: req.method,
      requestPayloadHash: payloadHash,
      status: 'IN_PROGRESS'
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - the key already exists
      idempotencyRecord = await IdempotencyKey.findOne({ key, user: userId, company: companyId });

      if (!idempotencyRecord) {
        return next(ApiError.internal('Idempotency error: Record exists but could not be fetched.'));
      }

      // Check payload mismatch
      if (idempotencyRecord.requestPayloadHash !== payloadHash) {
        return next(ApiError.badRequest('Idempotency key reused with a different payload.'));
      }

      if (idempotencyRecord.status === 'IN_PROGRESS') {
        const age = Date.now() - (idempotencyRecord.updatedAt || idempotencyRecord.createdAt).getTime();
        // If older than 2 minutes, assume crashed and allow retry
        if (age > 120000) {
          idempotencyRecord.status = 'IN_PROGRESS';
          await idempotencyRecord.save();
        } else {
          return res.status(409).json({ success: false, message: 'Request is already in progress. Please wait.' });
        }
      }

      if (idempotencyRecord.status === 'COMPLETED') {
        // Return the cached response
        return res.status(idempotencyRecord.responseStatus).json(idempotencyRecord.responseBody);
      }

      if (idempotencyRecord.status === 'FAILED') {
        // If it failed previously (e.g. transient error), allow it to be retried
        // Reset to IN_PROGRESS
        idempotencyRecord.status = 'IN_PROGRESS';
        await idempotencyRecord.save();
      }
    } else {
      return next(error);
    }
  }

  req.idempotencyRecord = idempotencyRecord;

  // Intercept the response to save it once the controller completes
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let currentStatus = 200;

  res.status = (code) => {
    currentStatus = code;
    return originalStatus(code);
  };

  res.json = function (body) {
    // Only update if not already marked COMPLETED by a transaction
    if (idempotencyRecord.status !== 'COMPLETED') {
      const isSuccess = currentStatus >= 200 && currentStatus < 400;

      idempotencyRecord.status = isSuccess ? 'COMPLETED' : 'FAILED';
      if (isSuccess) {
        idempotencyRecord.responseBody = body;
        idempotencyRecord.responseStatus = currentStatus;
      }

      idempotencyRecord.save().catch(err => {
        console.error('Failed to save idempotency key outcome:', err);
      });
    }

    return originalJson(body);
  };

  next();
};