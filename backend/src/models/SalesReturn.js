import mongoose from 'mongoose';

const salesReturnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  productName: { type: String, required: true },
  batch: { type: String },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 }
});

const salesReturnSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  returnNumber: { type: String, required: true },
  salesInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
  distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Distributor' },
  customerName: { type: String },
  returnDate: { type: Date, default: Date.now },
  reason: {
    type: String,
    enum: ['DEFECTIVE', 'EXPIRED', 'WRONG_ITEM', 'CUSTOMER_REQUEST', 'OTHER'],
    default: 'CUSTOMER_REQUEST'
  },
  items: [salesReturnItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  refundMethod: { type: String, enum: ['Credit Adjustment', 'Cash', 'Online/QR', 'Cheque'], default: 'Credit Adjustment' },
  remarks: { type: String, default: '' },
  status: { type: String, enum: ['COMPLETED', 'CANCELLED'], default: 'COMPLETED' }
}, { timestamps: true });

salesReturnSchema.index({ company: 1, returnNumber: 1 });

export default mongoose.model('SalesReturn', salesReturnSchema);
