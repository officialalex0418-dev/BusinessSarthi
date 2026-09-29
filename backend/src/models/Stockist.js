import mongoose from 'mongoose';

const stockistSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Stockist name is required'], trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 300 },
    panVat: { type: String, trim: true, uppercase: true, maxlength: 30 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    logo: { type: String, default: null },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', index: true },
    packageAssignedAt: Date,
    packageExpiresAt: Date,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE', index: true },
    registrationNumber: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    additionalInfo: { type: String, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    checkInRadiusMeters: { type: Number, default: 200 },
    settings: {
      timezone: { type: String, default: 'Asia/Kathmandu' },
      currency: { type: String, default: 'NPR' },
      language: { type: String, enum: ['English', 'Nepali'], default: 'English' },
      dateFormat: { type: String, enum: ['AD', 'BS'], default: 'BS' },
    },
  },
  { timestamps: true }
);

stockistSchema.index({ name: 1 });
stockistSchema.index({ email: 1 }, { unique: true });
stockistSchema.index({ createdAt: -1 });

export default mongoose.model('Stockist', stockistSchema);
