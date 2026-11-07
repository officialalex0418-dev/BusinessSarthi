import { PurchaseReturn, Inventory, Vendor } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';

export const listPurchaseReturns = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { company: req.companyId };

  if (req.query.search) {
    filter.$or = [
      { returnNumber: { $regex: req.query.search, $options: 'i' } },
      { remarks: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  if (req.query.vendorId) {
    filter.vendor = req.query.vendorId;
  }

  if (req.query.fromDate || req.query.toDate) {
    filter.returnDate = {};
    if (req.query.fromDate) filter.returnDate.$gte = new Date(req.query.fromDate);
    if (req.query.toDate) {
      const end = new Date(req.query.toDate);
      end.setHours(23, 59, 59, 999);
      filter.returnDate.$lte = end;
    }
  }

  const [items, total] = await Promise.all([
    PurchaseReturn.find(filter)
      .populate('vendor', 'name phone')
      .populate('staff', 'name')
      .populate('purchase', 'billNumber')
      .sort('-returnDate')
      .skip(skip)
      .limit(limit),
    PurchaseReturn.countDocuments(filter)
  ]);

  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

export const createPurchaseReturn = asyncHandler(async (req, res) => {
  const { purchaseId, vendorId, reason, items, refundMethod, remarks, returnDate } = req.body;

  if (!vendorId) {
    throw ApiError.badRequest('Vendor is required for purchase return');
  }

  if (!items || !items.length) {
    throw ApiError.badRequest('At least one item is required for purchase return');
  }

  // Generate return number
  const count = await PurchaseReturn.countDocuments({ company: req.companyId });
  const returnNumber = `PR-${String(count + 1).padStart(5, '0')}`;

  let totalAmount = 0;
  const processedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const amt = qty * price;
    totalAmount += amt;

    return {
      product: item.product,
      productName: item.productName || 'Returned Item',
      batch: item.batch || 'GENERAL',
      price,
      quantity: qty,
      amount: amt
    };
  });

  const purchaseReturn = await PurchaseReturn.create({
    company: req.companyId,
    staff: req.user._id,
    returnNumber,
    purchase: purchaseId || null,
    vendor: vendorId,
    reason: reason || 'DEFECTIVE',
    items: processedItems,
    totalAmount,
    refundMethod: refundMethod || 'Debit Adjustment',
    remarks: remarks || '',
    returnDate: returnDate ? new Date(returnDate) : new Date()
  });

  // Reduce inventory stock (since returned to vendor)
  for (const item of processedItems) {
    if (item.product) {
      await Inventory.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }
  }

  // Decrease vendor outstanding balance if debit adjustment
  if (vendorId && (refundMethod === 'Debit Adjustment' || !refundMethod)) {
    await Vendor.findByIdAndUpdate(vendorId, { $inc: { outstandingBalance: -totalAmount } });
  }

  audit({ req, action: 'CREATE_PURCHASE_RETURN', entity: 'PurchaseReturn', entityId: purchaseReturn._id });
  res.status(201).json({ success: true, data: { purchaseReturn } });
});

export const getPurchaseReturnDetails = asyncHandler(async (req, res) => {
  const purchaseReturn = await PurchaseReturn.findOne({ _id: req.params.id, company: req.companyId })
    .populate('vendor')
    .populate('staff', 'name email')
    .populate('purchase');

  if (!purchaseReturn) throw ApiError.notFound('Purchase return record not found');
  res.json({ success: true, data: { purchaseReturn } });
});

export const deletePurchaseReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await PurchaseReturn.findOne({ _id: req.params.id, company: req.companyId });
  if (!purchaseReturn) throw ApiError.notFound('Purchase return record not found');

  if (purchaseReturn.status === 'CANCELLED') {
    throw ApiError.badRequest('Purchase return is already cancelled');
  }

  // Revert inventory stock (add back stock)
  for (const item of purchaseReturn.items) {
    if (item.product) {
      await Inventory.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }
  }

  // Revert vendor balance
  if (purchaseReturn.vendor && purchaseReturn.refundMethod === 'Debit Adjustment') {
    await Vendor.findByIdAndUpdate(purchaseReturn.vendor, { $inc: { outstandingBalance: purchaseReturn.totalAmount } });
  }

  purchaseReturn.status = 'CANCELLED';
  await purchaseReturn.save();

  audit({ req, action: 'CANCEL_PURCHASE_RETURN', entity: 'PurchaseReturn', entityId: purchaseReturn._id });
  res.json({ success: true, message: 'Purchase return cancelled and inventory reverted' });
});
