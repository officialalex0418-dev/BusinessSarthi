import { SalesReturn, Inventory, Distributor } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';

export const listSalesReturns = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { company: req.companyId };

  if (req.query.search) {
    filter.$or = [
      { returnNumber: { $regex: req.query.search, $options: 'i' } },
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { remarks: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  if (req.query.distributorId) {
    filter.distributor = req.query.distributorId;
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
    SalesReturn.find(filter)
      .populate('distributor', 'name phone')
      .populate('staff', 'name')
      .populate('salesInvoice', 'invoiceNumber')
      .sort('-returnDate')
      .skip(skip)
      .limit(limit),
    SalesReturn.countDocuments(filter)
  ]);

  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

export const createSalesReturn = asyncHandler(async (req, res) => {
  const { salesInvoiceId, distributorId, customerName, reason, items, refundMethod, remarks, returnDate } = req.body;

  if (!items || !items.length) {
    throw ApiError.badRequest('At least one item is required for sales return');
  }

  // Generate return number
  const count = await SalesReturn.countDocuments({ company: req.companyId });
  const returnNumber = `SR-${String(count + 1).padStart(5, '0')}`;

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

  const salesReturn = await SalesReturn.create({
    company: req.companyId,
    staff: req.user._id,
    returnNumber,
    salesInvoice: salesInvoiceId || null,
    distributor: distributorId || null,
    customerName: customerName || '',
    reason: reason || 'CUSTOMER_REQUEST',
    items: processedItems,
    totalAmount,
    refundMethod: refundMethod || 'Credit Adjustment',
    remarks: remarks || '',
    returnDate: returnDate ? new Date(returnDate) : new Date()
  });

  // Restore inventory stock
  for (const item of processedItems) {
    if (item.product) {
      await Inventory.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }
  }

  // Adjust distributor outstanding balance if credit adjustment
  if (distributorId && (refundMethod === 'Credit Adjustment' || !refundMethod)) {
    await Distributor.findByIdAndUpdate(distributorId, { $inc: { outstandingBalance: -totalAmount } });
  }

  audit({ req, action: 'CREATE_SALES_RETURN', entity: 'SalesReturn', entityId: salesReturn._id });
  res.status(201).json({ success: true, data: { salesReturn } });
});

export const getSalesReturnDetails = asyncHandler(async (req, res) => {
  const salesReturn = await SalesReturn.findOne({ _id: req.params.id, company: req.companyId })
    .populate('distributor')
    .populate('staff', 'name email')
    .populate('salesInvoice');

  if (!salesReturn) throw ApiError.notFound('Sales return record not found');
  res.json({ success: true, data: { salesReturn } });
});

export const deleteSalesReturn = asyncHandler(async (req, res) => {
  const salesReturn = await SalesReturn.findOne({ _id: req.params.id, company: req.companyId });
  if (!salesReturn) throw ApiError.notFound('Sales return record not found');

  if (salesReturn.status === 'CANCELLED') {
    throw ApiError.badRequest('Sales return is already cancelled');
  }

  // Revert inventory stock
  for (const item of salesReturn.items) {
    if (item.product) {
      await Inventory.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }
  }

  // Revert distributor balance
  if (salesReturn.distributor && salesReturn.refundMethod === 'Credit Adjustment') {
    await Distributor.findByIdAndUpdate(salesReturn.distributor, { $inc: { outstandingBalance: salesReturn.totalAmount } });
  }

  salesReturn.status = 'CANCELLED';
  await salesReturn.save();

  audit({ req, action: 'CANCEL_SALES_RETURN', entity: 'SalesReturn', entityId: salesReturn._id });
  res.json({ success: true, message: 'Sales return cancelled and inventory reverted' });
});
