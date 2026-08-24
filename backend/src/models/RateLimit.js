import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['OTP_VERIFY'] },
    failedAttempts: { type: Number, default: 0 },
    blockExpiresAt: { type: Date, default: null },
    stage: { type: Number, default: 1 }, // 1: 15min, 2: 1hr, 3: Deactivation
    lastAttemptAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

rateLimitSchema.index({ ip: 1, type: 1 }, { unique: true });

export default mongoose.model('RateLimit', rateLimitSchema);
