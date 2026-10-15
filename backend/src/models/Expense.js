import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    stockist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stockist' },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['RENT', 'UTILITIES', 'SALARY', 'FUEL', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'TAX', 'MISC'],
      default: 'MISC'
    },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'], default: 'CASH' },
    paidTo: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

expenseSchema.index({ company: 1, expenseDate: -1 });
expenseSchema.index({ stockist: 1, expenseDate: -1 });

export default mongoose.model('Expense', expenseSchema);
