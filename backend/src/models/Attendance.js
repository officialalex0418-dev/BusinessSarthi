import mongoose from 'mongoose';

const geoPoint = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number] }, // [lng, lat]
};

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (company timezone)
    checkIn: {
      time: Date,
      location: geoPoint,
      address: String,
      photo: String,
      deviceInfo: { platform: String, model: String },
      isLate: { type: Boolean, default: false },
    },
    checkOut: {
      time: Date,
      location: geoPoint,
      address: String,
      photo: String,
      deviceInfo: { platform: String, model: String },
    },
    workedMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'LATE'],
      default: 'PRESENT',
      index: true,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ staff: 1, date: -1 }, { unique: true });
attendanceSchema.index({ company: 1, date: -1 });
attendanceSchema.index({ company: 1, status: 1, date: -1 }); // Added for dashboard/reports
attendanceSchema.index({ company: 1, 'checkIn.time': 1 }); // Added for live dashboard active staff check


export default mongoose.model('Attendance', attendanceSchema);
