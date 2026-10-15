import mongoose from 'mongoose';
import { Expense } from '../models/index.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

/** GET /expenses — List office expenses */
export const listExpenses = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { fromDate, toDate, category, search, page = 1, limit = 50 } = req.query;

  const filter = {
    $or: [{ company: companyId }, { stockist: companyId }]
  };

  if (category) filter.category = category;

  if (fromDate || toDate) {
    filter.expenseDate = {};
    if (fromDate) filter.expenseDate.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = end;
    }
  }

  if (search) {
    filter.$and = [
      {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { paidTo: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } }
        ]
      }
    ];
  }

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .populate('createdBy', 'name')
      .lean(),
    Expense.countDocuments(filter)
  ]);

  const totalAmountSum = await Expense.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.json({
    success: true,
    data: {
      items,
      totalAmount: totalAmountSum[0]?.total || 0,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
      }
    }
  });
});

/** POST /expenses — Add new office expense */
export const createExpense = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { title, category, amount, expenseDate, paymentMethod, paidTo, remarks } = req.body;

  if (!title || amount === undefined) {
    throw ApiError.badRequest('Title and amount are required');
  }

  const expense = await Expense.create({
    company: companyId,
    stockist: companyId,
    title,
    category: category || 'MISC',
    amount: Number(amount) || 0,
    expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    paymentMethod: paymentMethod || 'CASH',
    paidTo: paidTo || '',
    remarks: remarks || '',
    createdBy: req.user._id
  });

  audit({ req, action: 'CREATE_EXPENSE', entity: 'Expense', entityId: expense._id, company: companyId, meta: { title, amount } });

  res.status(201).json({ success: true, data: expense, message: 'Expense recorded successfully' });
});

/** PATCH /expenses/:id — Update expense */
export const updateExpense = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { id } = req.params;

  const expense = await Expense.findOne({
    _id: id,
    $or: [{ company: companyId }, { stockist: companyId }]
  });

  if (!expense) throw ApiError.notFound('Expense record not found');

  const fields = ['title', 'category', 'amount', 'expenseDate', 'paymentMethod', 'paidTo', 'remarks'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      if (f === 'expenseDate') expense[f] = new Date(req.body[f]);
      else if (f === 'amount') expense[f] = Number(req.body[f]) || 0;
      else expense[f] = req.body[f];
    }
  });

  await expense.save();

  audit({ req, action: 'UPDATE_EXPENSE', entity: 'Expense', entityId: id, company: companyId, meta: { title: expense.title, amount: expense.amount } });

  res.json({ success: true, data: expense, message: 'Expense updated successfully' });
});

/** DELETE /expenses/:id — Delete expense */
export const deleteExpense = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { id } = req.params;

  const expense = await Expense.findOneAndDelete({
    _id: id,
    $or: [{ company: companyId }, { stockist: companyId }]
  });

  if (!expense) throw ApiError.notFound('Expense record not found');

  audit({ req, action: 'DELETE_EXPENSE', entity: 'Expense', entityId: id, company: companyId, meta: { title: expense.title } });

  res.json({ success: true, message: 'Expense deleted successfully' });
});

/** GET /expenses/analytics — Summary analytics */
export const expenseAnalytics = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { fromDate, toDate } = req.query;

  const filter = {
    $or: [{ company: companyId }, { stockist: companyId }]
  };

  if (fromDate || toDate) {
    filter.expenseDate = {};
    if (fromDate) filter.expenseDate.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = end;
    }
  }

  const [categoryBreakdown, overallTotal] = await Promise.all([
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]),
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalExpense: overallTotal[0]?.total || 0,
      categories: categoryBreakdown
    }
  });
});
