import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import { Distributor, SalesInvoice, Payment, Cheque, Company } from './src/models/index.js';
import { adToBs, getBsMonthRange } from './src/utils/nepaliDate.js';

async function testAnalytics() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to DB");

  // Choose a company
  const company = await Company.findOne({});
  if (!company) {
    console.log("No company found");
    process.exit(0);
  }
  const companyId = company._id;

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  console.log("Testing new logic...");

  const allDistributorsWithBalance = await Distributor.find({ company: companyId, outstandingBalance: { $gt: 0 } }).select('_id');

  let overdueOutstanding = 0;

  if (allDistributorsWithBalance.length > 0) {
    const distributorIds = allDistributorsWithBalance.map(d => d._id);

    const [allInvoices, allPaymentsAgg] = await Promise.all([
      SalesInvoice.find({ distributor: { $in: distributorIds }, company: companyId })
        .select('distributor netTotal saleDate')
        .sort('saleDate')
        .lean(),
      Payment.aggregate([
        { $match: { distributor: { $in: distributorIds }, company: companyId } },
        { $group: { _id: '$distributor', totalPaid: { $sum: '$amount' } } }
      ])
    ]);

    const paymentsByDist = {};
    allPaymentsAgg.forEach(p => {
      paymentsByDist[p._id.toString()] = p.totalPaid;
    });

    const invoicesByDist = {};
    allInvoices.forEach(inv => {
      const dId = inv.distributor.toString();
      if (!invoicesByDist[dId]) invoicesByDist[dId] = [];
      invoicesByDist[dId].push(inv);
    });

    for (const dist of allDistributorsWithBalance) {
      const dId = dist._id.toString();
      const invoices = invoicesByDist[dId] || [];
      let totalPaid = paymentsByDist[dId] || 0;

      for (const inv of invoices) {
        const unpaidAmount = Math.max(0, inv.netTotal - totalPaid);
        totalPaid = Math.max(0, totalPaid - inv.netTotal);

        if (unpaidAmount > 0 && new Date(inv.saleDate) < ninetyDaysAgo) {
          overdueOutstanding += unpaidAmount;
        }
      }
    }
  }

  console.log("Overdue outstanding calculated:", overdueOutstanding);

  await mongoose.disconnect();
}

testAnalytics().catch(console.error);