import mongoose from 'mongoose';
import { Vendor, Purchase, VendorPayment, Company } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { sendAccountLedgerExcel } from '../services/report.service.js';

/** GET /vendors */
export const listVendors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { company: req.companyId, isActive: true };

  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Vendor.find(filter).sort('name').skip(skip).limit(limit),
    Vendor.countDocuments(filter),
  ]);
  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

/** GET /vendors/:id */
export const getVendorDetails = asyncHandler(async (req, res) => {
  let vendor = await Vendor.findOne({ _id: req.params.id, company: req.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');

  const [purchases, payments] = await Promise.all([
    Purchase.find({ vendor: vendor._id, company: req.companyId }).sort('createdAt'),
    VendorPayment.find({ vendor: vendor._id, company: req.companyId }).sort('paymentDate'),
  ]);

  // Recalculate balance from history to ensure accuracy (Fixes sync issues)
  const totalPurchased = purchases.reduce((sum, p) => sum + (p.netTotal || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const actualBalance = Math.max(0, totalPurchased - totalPaid);

  if (vendor.outstandingBalance !== actualBalance) {
    vendor.outstandingBalance = actualBalance;
    await vendor.save();
  }

  res.json({
    success: true,
    data: {
      vendor,
      purchases: purchases.reverse(),
      payments: payments.reverse(),
      history: [
        ...purchases.map(p => ({ id: p._id, type: 'PURCHASE', date: p.createdAt, amount: p.netTotal, ref: 'Purchase', createdAt: p.createdAt })),
        ...payments.map(p => ({
            id: p._id,
            type: 'PAYMENT',
            date: p.paymentDate,
            amount: p.amount,
            ref: 'Payment',
            method: p.method,
            chequeDetails: p.chequeDetails,
            createdAt: p.createdAt
        }))
      ].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        // Secondary sort by entry time if dates are identical
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    }
  });
});

/** POST /vendors */
export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create({ ...req.body, company: req.companyId });
  audit({ req, action: 'CREATE_VENDOR', entity: 'Vendor', entityId: vendor._id });
  res.status(201).json({ success: true, data: { vendor } });
});

/** PATCH /vendors/:id */
export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!vendor) throw ApiError.notFound('Vendor not found');
  audit({ req, action: 'UPDATE_VENDOR', entity: 'Vendor', entityId: vendor._id });
  res.json({ success: true, data: { vendor } });
});

/** DELETE /vendors/:id */
export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    { isActive: false },
    { new: true }
  );
  if (!vendor) throw ApiError.notFound('Vendor not found');
  audit({ req, action: 'DEACTIVATE_VENDOR', entity: 'Vendor', entityId: vendor._id });
  res.json({ success: true, message: 'Vendor deactivated' });
});

/** POST /vendor-payments */
export const recordVendorPayment = asyncHandler(async (req, res) => {
  const { vendorId, amount, method, remarks, paymentDate, chequeNumber, bankName, maturityDate } = req.body;

  const vendor = await Vendor.findOne({ _id: vendorId, company: req.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');

  let finalDate = new Date();
  if (paymentDate) {
    const pDate = new Date(paymentDate);
    if (!isNaN(pDate.getTime())) {
        const now = new Date();
        if (pDate.toDateString() === now.toDateString()) {
          finalDate = now;
        } else {
          if (typeof paymentDate === 'string' && paymentDate.length <= 10) {
            finalDate = new Date(paymentDate + 'T12:00:00');
          } else {
            finalDate = pDate;
          }
        }
    }
  }

  const paymentData = {
    company: req.companyId,
    vendor: vendorId,
    amount: Number(amount),
    method,
    remarks,
    paymentDate: finalDate,
    createdBy: req.user._id
  };

  if (method === 'CHEQUE') {
    paymentData.chequeDetails = {
        number: chequeNumber,
        bankName: bankName,
        maturityDate: maturityDate || finalDate,
        status: 'PENDING'
    };
  }

  const payment = await VendorPayment.create(paymentData);

  // Update vendor outstanding balance
  vendor.outstandingBalance -= Number(amount);
  await vendor.save();

  audit({ req, action: 'RECORD_VENDOR_PAYMENT', entity: 'VendorPayment', entityId: payment._id });
  res.status(201).json({ success: true, data: { payment } });
});

/** DELETE /vendor-payments/:id */
export const deleteVendorPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await VendorPayment.findOne({ _id: id, company: req.companyId });
  if (!payment) throw ApiError.notFound('Payment record not found');

  // Reverse vendor outstanding balance
  await Vendor.findByIdAndUpdate(payment.vendor, {
    $inc: { outstandingBalance: payment.amount }
  });

  await VendorPayment.findByIdAndDelete(id);

  audit({ req, action: 'DELETE_VENDOR_PAYMENT', entity: 'VendorPayment', entityId: id });
  res.json({ success: true, message: 'Payment record removed' });
});

/** PATCH /vendor-payments/:id */
export const updateVendorPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, method, remarks, paymentDate, chequeNumber, bankName, maturityDate } = req.body;

  const payment = await VendorPayment.findOne({ _id: id, company: req.companyId });
  if (!payment) throw ApiError.notFound('Payment record not found');

  const oldAmount = payment.amount;
  const newAmount = Number(amount);

  payment.amount = newAmount;
  payment.method = method || payment.method;
  payment.remarks = remarks || payment.remarks;

  if (payment.method === 'CHEQUE') {
      payment.chequeDetails = {
          ...payment.chequeDetails,
          number: chequeNumber || payment.chequeDetails?.number,
          bankName: bankName || payment.chequeDetails?.bankName,
          maturityDate: maturityDate || payment.chequeDetails?.maturityDate || payment.paymentDate
      };
  }

  if (paymentDate) {
    const pDate = new Date(paymentDate);
    const now = new Date();
    if (pDate.toDateString() === now.toDateString()) {
      payment.paymentDate = now;
    } else {
      payment.paymentDate = new Date(paymentDate + (paymentDate.includes('T') ? '' : 'T12:00:00'));
    }
  }

  await payment.save();

  // Update vendor balance (Reverse old, add new)
  if (oldAmount !== newAmount) {
    await Vendor.findByIdAndUpdate(payment.vendor, {
      $inc: { outstandingBalance: oldAmount - newAmount }
    });
  }

  audit({ req, action: 'UPDATE_VENDOR_PAYMENT', entity: 'VendorPayment', entityId: id, meta: { oldAmount, newAmount } });
  res.json({ success: true, data: { payment } });
});

/** GET /reports/vendors/:id/ledger/excel */
export const exportLedgerExcel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [vendor, company, purchases, payments] = await Promise.all([
    Vendor.findOne({ _id: id, company: req.companyId }),
    Company.findById(req.companyId),
    Purchase.find({ vendor: id, company: req.companyId }).sort('createdAt'),
    VendorPayment.find({ vendor: id, company: req.companyId }).sort('paymentDate'),
  ]);

  if (!vendor) throw ApiError.notFound('Vendor not found');

  const rawLedger = [
    ...purchases.map(p => ({ type: 'PURCHASE', date: p.createdAt, amount: p.netTotal, ref: 'PURCHASE' })),
    ...payments.map(p => ({ type: 'PAYMENT', date: p.paymentDate, amount: p.amount, ref: p.method }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let balance = 0;
  const entries = rawLedger.map(item => {
    if (item.type === 'PURCHASE') balance += item.amount;
    else balance -= item.amount;
    return { ...item, runningBalance: balance };
  });

  audit({ req, action: 'EXPORT_VENDOR_LEDGER_EXCEL', entity: 'Vendor', entityId: id });

  await sendAccountLedgerExcel(res, {
    filename: `Vendor_Ledger_${vendor.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
    company,
    entity: vendor,
    entries,
    finalBalance: balance,
    type: 'VENDOR'
  });
});

/** GET /vendors/analytics */
export const vendorAnalytics = asyncHandler(async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.companyId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOutstanding,
    monthlyPurchases,
    monthlyPayments,
    activeCount
  ] = await Promise.all([
    Vendor.aggregate([
      { $match: { company: companyId, isActive: true } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } }
    ]),
    Purchase.aggregate([
      { $match: { company: companyId, createdAt: { $gte: startOfMonth }, vendor: { $ne: null } } },
      { $group: { _id: null, total: { $sum: '$netTotal' } } }
    ]),
    VendorPayment.aggregate([
      { $match: { company: companyId, paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Vendor.countDocuments({ company: companyId, isActive: true })
  ]);

  res.json({
    success: true,
    data: {
      totalOutstanding: totalOutstanding[0]?.total || 0,
      monthlyPurchases: monthlyPurchases[0]?.total || 0,
      monthlyPayments: monthlyPayments[0]?.total || 0,
      activeVendors: activeCount
    }
  });
});
