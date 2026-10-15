import mongoose from 'mongoose';
import { SalesInvoice, Inventory, Distributor, Payment } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

export const createSalesInvoice = asyncHandler(async (req, res) => {
  const { distributorId, customerName, items, discountPct, vatPct, paymentMethod, dueDate, remarks } = req.body;
  const companyId = req.companyId;

  if (!items || !items.length) {
    throw ApiError.badRequest('Invoice items are required');
  }

  let distributor = null;
  if (distributorId) {
    distributor = await Distributor.findOne({ _id: distributorId, company: companyId });
    if (!distributor) throw ApiError.notFound('Distributor not found');
  }

  let totalAmount = 0;
  const processedItems = [];

  for (const item of items) {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const amount = price * quantity;
    totalAmount += amount;

    let product = null;
    if (item.product || item.productId) {
      product = await Inventory.findOne({ _id: item.product || item.productId, company: companyId }).select('+movements');
    } else if (item.productName) {
      product = await Inventory.findOne({ productName: item.productName.trim(), company: companyId }).select('+movements');
    }

    if (product) {
      if (product.quantity < quantity) {
        throw ApiError.badRequest(`Insufficient stock for ${product.productName}. Available: ${product.quantity}`);
      }
      product.quantity -= quantity;
      product.movements.push({
        type: 'OUT',
        quantity: quantity,
        note: `Sales Invoice - Sold to ${distributor?.name || customerName || 'Walk-in'}`,
        by: req.user._id
      });
      await product.save();
    }

    processedItems.push({
      product: product?._id,
      productName: item.productName || product?.productName || 'Product',
      batch: item.batch || product?.batchNumber || 'GENERAL',
      price,
      costPrice: Number(product?.costPrice ?? item.costPrice ?? 0),
      mrp: Number(item.mrp || product?.mrp || 0),
      quantity,
      amount
    });
  }

  const discountAmount = (totalAmount * (Number(discountPct) || 0)) / 100;
  const taxableAmount = totalAmount - discountAmount;
  const vatAmount = (taxableAmount * (Number(vatPct) || 0)) / 100;
  const netTotal = taxableAmount + vatAmount;

  // Generate SBXXXXX invoice number
  const lastInvoice = await SalesInvoice.findOne({ company: companyId, invoiceNumber: /^SB/ }).sort('-createdAt');
  let nextNum = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/SB(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const invoiceNumber = `SB${String(nextNum).padStart(5, '0')}`;

  const invoice = await SalesInvoice.create({
    company: companyId,
    staff: req.user._id,
    invoiceNumber,
    distributor: distributorId || null,
    customerName: customerName || distributor?.name || 'Walk-in',
    items: processedItems,
    totalAmount,
    discountPct: Number(discountPct) || 0,
    discountAmount,
    taxableAmount,
    vatPct: Number(vatPct) || 0,
    vatAmount,
    netTotal,
    paymentMethod,
    dueDate,
    remarks: remarks || ''
  });

  const isCredit = !paymentMethod || paymentMethod.toUpperCase() === 'CREDIT';

  if (distributor) {
    if (isCredit) {
      distributor.outstandingBalance += netTotal;
    }
    await distributor.save();
  }

  if (!isCredit && distributorId) {
    const normalizedMethod = (paymentMethod || 'CASH').toUpperCase();
    let paymentMethodEnum = 'CASH';
    if (normalizedMethod.includes('CHEQUE')) paymentMethodEnum = 'CHEQUE';
    else if (normalizedMethod.includes('BANK') || normalizedMethod.includes('ONLINE') || normalizedMethod.includes('QR') || normalizedMethod.includes('TRANSFER')) paymentMethodEnum = 'BANK_TRANSFER';
    else paymentMethodEnum = 'CASH';

    await Payment.create({
      company: companyId,
      distributor: distributorId,
      amount: netTotal,
      method: paymentMethodEnum,
      paymentDate: new Date(),
      remarks: `Auto-recorded payment for cash invoice ${invoiceNumber} (${paymentMethod})`,
      adjustedInvoices: [{ invoice: invoice._id, amount: netTotal }],
      createdBy: req.user._id
    });
  }

  audit({ req, action: 'CREATE_SALES_INVOICE', entity: 'SalesInvoice', entityId: invoice._id, company: companyId });
  res.status(201).json({ success: true, data: { invoice } });
});

export const listSalesInvoices = asyncHandler(async (req, res) => {
  const filter = { company: req.companyId };

  if (req.query.distributorId) filter.distributor = req.query.distributorId;

  if (req.query.fromDate || req.query.toDate) {
    filter.createdAt = {};
    if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate + 'T00:00:00');
    if (req.query.toDate) filter.createdAt.$lte = new Date(req.query.toDate + 'T23:59:59.999');
  }

  const items = await SalesInvoice.find(filter).sort('-createdAt')
    .populate('staff', 'name')
    .populate('distributor', 'name panVat registrationNumber phone address')
    .populate('items.product', 'costPrice sellingPrice price mrp')
    .limit(Number(req.query.limit) || 10000);
  res.json({ success: true, data: { items } });
});

export const getSalesInvoice = asyncHandler(async (req, res) => {
  const item = await SalesInvoice.findOne({ _id: req.params.id, company: req.companyId })
    .populate('staff', 'name')
    .populate('distributor', 'name panVat registrationNumber phone address')
    .populate('items.product', 'costPrice sellingPrice price mrp');
  if (!item) throw ApiError.notFound('Invoice not found');
  res.json({ success: true, data: item });
});

export const updateSalesInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, discountPct, vatPct, customerName, remarks, dueDate } = req.body;
  const companyId = req.companyId;

  const invoice = await SalesInvoice.findOne({ _id: id, company: companyId });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  const oldNetTotal = invoice.netTotal;
  const updateData = {};

  if (items !== undefined && Array.isArray(items)) {
    // 1. Reverse Inventory Changes from Old Items
    for (const item of invoice.items) {
      if (item.product) {
        await Inventory.findByIdAndUpdate(item.product, {
          $inc: { quantity: Number(item.quantity) },
          $push: {
            movements: {
              type: 'IN',
              quantity: item.quantity,
              note: `Invoice Correction (Reversing Old Items) - ID: ${invoice.invoiceNumber}`,
              by: req.user._id
            }
          }
        });
      }
    }

    // 2. Process New Items and Apply to Inventory
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const amount = price * quantity;
      totalAmount += amount;

      let product = null;
      if (item.product || item.productId) {
        product = await Inventory.findOne({ _id: item.product || item.productId, company: companyId }).select('+movements');
      } else {
        product = await Inventory.findOne({ productName: item.productName, company: companyId }).select('+movements');
      }

      if (product) {
        if (product.quantity < quantity) {
          throw ApiError.badRequest(`Insufficient stock for ${product.productName}. Available: ${product.quantity}`);
        }
        product.quantity -= quantity;
        product.movements.push({
          type: 'OUT',
          quantity: quantity,
          note: `Invoice Correction (Applying New Items) - ID: ${invoice.invoiceNumber}`,
          by: req.user._id
        });
        await product.save();
      }

      processedItems.push({
        product: product?._id,
        productName: item.productName,
        batch: item.batch,
        price,
        mrp: Number(item.mrp || 0),
        quantity,
        amount
      });
    }

    updateData.items = processedItems;
    updateData.totalAmount = totalAmount;
    const dPct = discountPct !== undefined ? Number(discountPct) : invoice.discountPct;
    const vPct = vatPct !== undefined ? Number(vatPct) : invoice.vatPct;
    updateData.discountPct = dPct;
    updateData.vatPct = vPct;
    updateData.discountAmount = (totalAmount * dPct) / 100;
    updateData.taxableAmount = totalAmount - updateData.discountAmount;
    updateData.vatAmount = (updateData.taxableAmount * vPct) / 100;
    updateData.netTotal = updateData.taxableAmount + updateData.vatAmount;
  } else {
    if (discountPct !== undefined) updateData.discountPct = Number(discountPct);
    if (vatPct !== undefined) updateData.vatPct = Number(vatPct);
    if (customerName !== undefined) updateData.customerName = customerName;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    if (discountPct !== undefined || vatPct !== undefined) {
      const dPct = discountPct !== undefined ? Number(discountPct) : invoice.discountPct;
      const vPct = vatPct !== undefined ? Number(vatPct) : invoice.vatPct;
      updateData.discountAmount = (invoice.totalAmount * dPct) / 100;
      updateData.taxableAmount = invoice.totalAmount - updateData.discountAmount;
      updateData.vatAmount = (updateData.taxableAmount * vPct) / 100;
      updateData.netTotal = updateData.taxableAmount + updateData.vatAmount;
    }
  }

  const updatedInvoice = await SalesInvoice.findOneAndUpdate(
    { _id: id, company: companyId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  // 3. Sync Distributor Balance
  if (updatedInvoice.distributor && Math.abs(updatedInvoice.netTotal - oldNetTotal) > 0.01) {
    const diff = updatedInvoice.netTotal - oldNetTotal;
    await mongoose.model('Distributor').findByIdAndUpdate(updatedInvoice.distributor, {
      $inc: { outstandingBalance: diff }
    });
  }

  audit({ req, action: 'UPDATE_SALES_INVOICE', entity: 'SalesInvoice', entityId: updatedInvoice._id });
  res.json({ success: true, data: updatedInvoice });
});

export const deleteSalesInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.companyId;

  const invoice = await SalesInvoice.findOne({ _id: id, company: companyId });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  // 1. Restore Inventory Quantities from the Deleted Invoice Items
  for (const item of invoice.items) {
    if (item.product) {
      await Inventory.findByIdAndUpdate(item.product, {
        $inc: { quantity: Number(item.quantity) },
        $push: {
          movements: {
            type: 'IN',
            quantity: item.quantity,
            note: `Sales Invoice Deleted - Restored Stock: ${invoice.invoiceNumber}`,
            by: req.user._id
          }
        }
      });
    }
  }

  // 2. Adjust distributor balance if needed
  if (invoice.distributor) {
    await mongoose.model('Distributor').findByIdAndUpdate(invoice.distributor, {
      $inc: { outstandingBalance: -invoice.netTotal }
    });
  }

  await SalesInvoice.findByIdAndDelete(id);

  audit({ req, action: 'DELETE_SALES_INVOICE', entity: 'SalesInvoice', entityId: id, meta: { invoiceNumber: invoice.invoiceNumber } });

  res.json({ success: true, message: 'Invoice deleted successfully' });
});
