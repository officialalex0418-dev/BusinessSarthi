import { Target, User, Sale, SalesInvoice } from '../models/index.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { bsToAd, bsMapping } from '../utils/nepaliDate.js';

/** Assign/Update targets in bulk for a specific month */
export const setTargets = asyncHandler(async (req, res) => {
  const { month, calendarType, targets } = req.body; // month: YYYY-MM, targets: [{ staffId, amount }]
  const companyId = req.user.company;

  if (!month || !calendarType || !Array.isArray(targets)) {
    throw ApiError.badRequest('Missing required fields');
  }

  const ops = targets.map(t => ({
    updateOne: {
      filter: { staff: t.staffId, month, calendarType, company: companyId },
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
  const companyId = req.user.company;

  if (!month || !calendarType) {
    throw ApiError.badRequest('Month and calendarType are required');
  }

  const targets = await Target.find({ company: companyId, month, calendarType });
  res.json({ success: true, data: targets });
});

/** Calculate achievement report (Target vs Sales) */
export const getAchievementReport = asyncHandler(async (req, res) => {
  const { month, calendarType, staffId, startDate, endDate } = req.query;
  const companyId = req.user.company;

  let from, to;

  if (startDate && endDate) {
    from = new Date(startDate);
    from.setHours(0, 0, 0, 0);
    to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
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
    throw ApiError.badRequest('Either month/calendarType or startDate/endDate must be provided');
  }

  const match = { company: companyId, saleDate: { $gte: from, $lte: to } };
  if (staffId) match.staff = staffId;

  // Aggregate Sales (Generic ONLY - as requested)
  const salesAgg = await Sale.aggregate([
    { $match: match },
    { $group: { _id: '$staff', total: { $sum: '$amount' } } }
  ]);

  // Fetch Targets for the month
  const targets = (month && calendarType)
    ? await Target.find({ company: companyId, month, calendarType })
    : [];

  // Fetch Relevant Staff
  const staffQuery = { company: companyId, role: { $in: ['STAFF', 'COMPANY_MANAGER'] }, isActive: true };
  if (staffId) staffQuery._id = staffId;
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

  // Trend Data (Last 30 days or Month range)
  const trend = await Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', amount: 1, _id: 0 } }
  ]);

  res.json({ success: true, data: report, stats, trend, range: { from, to } });
});
