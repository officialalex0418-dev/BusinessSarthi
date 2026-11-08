import mongoose from 'mongoose';

const vendorAdjustmentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    claimType: {
      type: String,
      enum: ['Discount', 'Sales Commission', 'Incentive', 'Bonus', 'Others'],
      required: true
    },
    customClaimType: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Cheque', 'BankTransfer', 'Balance Adjustment'],
      required: true
    },
    chequeDetails: {
      number: String,
      bankName: String,
      issueDate: Date,
      depositDate: Date,
    },
    adjustmentDate: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

vendorAdjustmentSchema.index({ company: 1, vendor: 1 });
vendorAdjustmentSchema.index({ adjustmentDate: -1 });

export default mongoose.model('VendorAdjustment', vendorAdjustmentSchema);
