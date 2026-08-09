import mongoose from 'mongoose';

const targetSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    month: { type: String, required: true }, // YYYY-MM (AD or BS)
    amount: { type: Number, required: true, default: 0 },
    calendarType: { type: String, enum: ['AD', 'BS'], required: true },
  },
  { timestamps: true }
);

targetSchema.index({ staff: 1, month: 1, calendarType: 1 }, { unique: true });

export default mongoose.model('Target', targetSchema);
