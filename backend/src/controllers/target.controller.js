import mongoose from 'mongoose';
import { Target, User, Sale, SalesInvoice } from '../models/index.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { bsToAd, bsMapping, adToBs } from '../utils/nepaliDate.js';
import { rangeFromPeriod } from '../utils/dates.js';

/** Assign/Update targets in bulk for a specific month */
export const setTargets = asyncHandler(async (req, res) => {
  const { month, calendarType, targets } = req.body; // month: YYYY-MM, targets: [{ staffId, amount }]
  const companyId = req.companyId;

  if (!month || !calendarType || !Array.isArray(targets)) {
    throw ApiError.badRequest('Missing required fields');
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);

  const ops = targets.map(t => ({
    updateOne: {
      filter: { staff: new mongoose.Types.ObjectId(t.staffId), month, calendarType, company: companyOid },
      update: { $set: { amount: Number(t.amount) || 0 } },
      upsert: true
    }
  }));

  if (ops.length > 0) {
    await Target.bulkWrite(ops);
  }

  res.json({ success: true, message: 'Targets updated successfully' });
});

/** Get assigned targets for a specific month */
export const getTargets = asyncHandler(async (req, res) => {
  const { month, calendarType } = req.query;
  const companyId = req.companyId;

  if (!month || !calendarType) {
    throw ApiError.badRequest('Month and calendarType are required');
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);

  const targets = await Target.find({ company: companyOid, month, calendarType });
  res.json({ success: true, data: targets });
});

/** Calculate achievement report (Target vs Sales) */
export const getAchievementReport = asyncHandler(async (req, res) => {
  const { month, calendarType, staffId, startDate, endDate, period } = req.query;
  const companyId = req.companyId;

  if (!companyId) throw ApiError.forbidden('No company associated');

  const companyOid = new mongoose.Types.ObjectId(companyId);

  let from, to;

  if (startDate && endDate) {
    from = new Date(startDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
  } else if (period) {
    const range = rangeFromPeriod(period);
    from = range.start;
    to = range.end;
  } else if (month && calendarType) {
    if (calendarType === 'BS') {
      const [y, m] = month.split('-').map(Number);
      if (!bsMapping[y]) throw ApiError.badRequest('Invalid BS year');
      const days = bsMapping[y][m - 1];
      from = bsToAd(`${month}-01`);
      to = bsToAd(`${month}-${String(days).padStart(2, '0')}`);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
    } else {
      const [y, m] = month.split('-').map(Number);
      from = new Date(y, m - 1, 1);
      from.setHours(0, 0, 0, 0);
      to = new Date(y, m, 0, 23, 59, 59, 999);
    }
  } else {
    // Default to this month
    const range = rangeFromPeriod('monthly');
    from = range.start;
    to = range.end;
  }

  const match = { company: companyOid, saleDate: { $gte: from, $lte: to } };
  if (staffId && staffId !== 'all') match.staff = new mongoose.Types.ObjectId(staffId.toString());

  // Aggregate Sales (Generic ONLY - as requested)
  const salesAgg = await Sale.aggregate([
    { $match: match },
    { $group: { _id: '$staff', total: { $sum: '$amount' } } }
  ]);

  // Fetch Targets for the month (only if monthly view is used, otherwise targets are hard to aggregate)
  const targets = (month && calendarType)
    ? await Target.find({ company: companyOid, month, calendarType })
    : [];

  // Fetch Relevant Staff
  const staffQuery = { company: companyOid, role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true };
  if (staffId && staffId !== 'all') staffQuery._id = new mongoose.Types.ObjectId(staffId.toString());
  const allStaff = await User.find(staffQuery).select('name position');

  const report = allStaff.map(s => {
    const achieved = salesAgg.find(x => x._id.toString() === s._id.toString())?.total || 0;
    const target = targets.find(x => x.staff.toString() === s._id.toString())?.amount || 0;

    return {
      staffId: s._id,
      name: s.name,
      position: s.position,
      target,
      achieved,
      percent: target > 0 ? (achieved / target) * 100 : 0
    };
  });

  // Dashboard Aggregates
  const stats = {
    totalTarget: report.reduce((sum, r) => sum + r.target, 0),
    totalAchieved: report.reduce((sum, r) => sum + r.achieved, 0),
    staffCount: report.length,
    completedStaff: report.filter(r => r.percent >= 100).length,
  };

  // Trend Data with Calendar support
  const trendRaw = await Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const trend = trendRaw.map(t => {
    let label = t._id; // YYYY-MM-DD
    if (calendarType === 'BS') {
       const bs = adToBs(new Date(t._id));
       if (bs) label = `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`;
    }
    return { date: label, amount: t.amount };
  });

  // Top 10 Selling Products
  const topProducts = await Sale.aggregate([
    { $match: match },
    { $group: { _id: '$productName', total: { $sum: '$amount' }, quantity: { $sum: '$quantity' } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
    { $project: { name: '$_id', amount: '$total', quantity: 1, _id: 0 } }
  ]);

  res.json({ success: true, data: report, stats, trend, topProducts, range: { from, to } });
});
