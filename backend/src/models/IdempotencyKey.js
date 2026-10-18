import mongoose from 'mongoose';

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, required: true },
    requestPath: { type: String, required: true },
    requestMethod: { type: String, required: true },
    requestPayloadHash: { type: String, required: true },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'], required: true, default: 'IN_PROGRESS' },
    responseBody: { type: mongoose.Schema.Types.Mixed },
    responseStatus: { type: Number },
    // Expire keys after 24 hours automatically
    createdAt: { type: Date, default: Date.now, expires: 86400 }
  }
);

// Compound unique index on key + user + company to scope the idempotency correctly
idempotencyKeySchema.index({ key: 1, user: 1, company: 1 }, { unique: true });

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);