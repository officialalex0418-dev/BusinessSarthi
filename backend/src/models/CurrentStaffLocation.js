import mongoose from 'mongoose';

const currentStaffLocationSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
    accuracy: Number,
    batteryLevel: Number,
    address: String,
    recordedAt: Date, // Time from device
    receivedAt: Date, // Time at server
    source: String, // BACKGROUND, CHECKIN, LIVE_REFRESH, etc.
    lastStoredAt: Date, // Timestamp of the last point that was saved to historical LocationLog
    nextAllowedAt: Date, // Next timestamp when persistence to LocationLog is allowed (for atomic throttling)
    lastRefreshRequestedAt: Date, // Server-side cooldown tracking
    status: String, // Calculated LIVE, RECENT, STALE, etc.
  },
  { timestamps: true }
);

currentStaffLocationSchema.index({ company: 1, recordedAt: -1 });

export default mongoose.model('CurrentStaffLocation', currentStaffLocationSchema);
