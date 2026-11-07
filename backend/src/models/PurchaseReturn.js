import mongoose from 'mongoose';

const purchaseReturnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  productName: { type: String, required: true },
  batch: { type: String },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 }
});

const purchaseReturnSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  returnNumber: { type: String, required: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  returnDate: { type: Date, default: Date.now },
  reason: {
    type: String,
    enum: ['DEFECTIVE', 'EXPIRED', 'DAMAGED', 'QUALITY_ISSUE', 'OTHER'],
    default: 'DEFECTIVE'
  },
  items: [purchaseReturnItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  refundMethod: { type: String, enum: ['Debit Adjustment', 'Cash', 'Online/QR', 'Cheque'], default: 'Debit Adjustment' },
  remarks: { type: String, default: '' },
  status: { type: String, enum: ['COMPLETED', 'CANCELLED'], default: 'COMPLETED' }
}, { timestamps: true });

purchaseReturnSchema.index({ company: 1, returnNumber: 1 });

export default mongoose.model('PurchaseReturn', purchaseReturnSchema);
