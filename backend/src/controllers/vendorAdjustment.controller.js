import { VendorAdjustment, Vendor } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';

export const listVendorAdjustments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { company: req.companyId };

  if (req.query.vendorId) filter.vendor = req.query.vendorId;

  const [items, total] = await Promise.all([
    VendorAdjustment.find(filter)
      .populate('vendor', 'name phone')
      .populate('createdBy', 'name')
      .sort('-adjustmentDate')
      .skip(skip)
      .limit(limit),
    VendorAdjustment.countDocuments(filter)
  ]);

  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

export const createVendorAdjustment = asyncHandler(async (req, res) => {
  const { vendorId, claimType, customClaimType, amount, paymentMode, chequeDetails, remarks, adjustmentDate } = req.body;

  if (!vendorId || !amount) {
    throw ApiError.badRequest('Vendor and amount are required');
  }

  const vendor = await Vendor.findOne({ _id: vendorId, company: req.companyId });
  if (!vendor) throw ApiError.notFound('Vendor not found');

  const adjustment = await VendorAdjustment.create({
    company: req.companyId,
    vendor: vendorId,
    claimType: claimType || 'Discount',
    customClaimType: claimType === 'Others' ? customClaimType : undefined,
    amount: Number(amount) || 0,
    paymentMode: paymentMode || 'Balance Adjustment',
    chequeDetails: paymentMode === 'Cheque' ? chequeDetails : undefined,
    remarks: remarks || '',
    adjustmentDate: adjustmentDate ? new Date(adjustmentDate) : new Date(),
    createdBy: req.user._id
  });

  // Adjust vendor outstanding balance (reduce balance as income / claim adjustment)
  vendor.outstandingBalance = Math.max(0, (vendor.outstandingBalance || 0) - Number(amount));
  await vendor.save();

  audit({ req, action: 'CREATE_VENDOR_ADJUSTMENT', entity: 'VendorAdjustment', entityId: adjustment._id });
  res.status(201).json({ success: true, data: { adjustment } });
});

export const deleteVendorAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await VendorAdjustment.findOne({ _id: req.params.id, company: req.companyId });
  if (!adjustment) throw ApiError.notFound('Adjustment record not found');

  const vendor = await Vendor.findById(adjustment.vendor);
  if (vendor) {
    vendor.outstandingBalance = (vendor.outstandingBalance || 0) + adjustment.amount;
    await vendor.save();
  }

  await adjustment.deleteOne();

  audit({ req, action: 'DELETE_VENDOR_ADJUSTMENT', entity: 'VendorAdjustment', entityId: adjustment._id });
  res.json({ success: true, message: 'Vendor adjustment deleted and balance reverted' });
});
