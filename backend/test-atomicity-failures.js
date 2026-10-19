import mongoose from 'mongoose';
import { Company, User, Distributor, Payment, IdempotencyKey } from './src/models/index.js';
import { recordPayment } from './src/controllers/distributor.controller.js';
import { withIdempotency } from './src/middleware/idempotency.js';

const URI = 'mongodb://127.0.0.1:27018/transaction_test?replicaSet=rs0';

async function setup() {
  await mongoose.connect(URI);

  // Clean up
  await Company.deleteMany({});
  await User.deleteMany({});
  await Distributor.deleteMany({});
  await Payment.deleteMany({});
  await IdempotencyKey.deleteMany({});

  const company = await Company.create({ name: 'Test Co', email: 'co@example.com', phone: '123' });
  const user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123', role: 'COMPANY_MANAGER', company: company._id, staffId: 'STF1' });
  const distributor = await Distributor.create({ name: 'Test Dist', email: 'dist@example.com', phone: '123', address: 'addr', company: company._id, outstandingBalance: 1000 });

  return { company, user, distributor };
}

async function run() {
  const { company, user, distributor } = await setup();
  console.log(`Initial balance: ${distributor.outstandingBalance}`);

  const makeReq = (key, amt) => ({
    headers: { 'x-idempotency-key': key },
    body: { distributorId: distributor._id.toString(), amount: amt, method: 'CASH', remarks: 'test payment' },
    user: { _id: user._id },
    companyId: company._id,
    path: '/payments',
    method: 'POST'
  });

  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };

  const next = (err) => {
    if (err) throw err;
  };

  // --- Test 3: Failure before commit can be retried safely ---
  console.log("\n--- Test: Simulated Crash / Failure Before Commit ---");
  const reqCrash = makeReq('crash-key', 300);

  await withIdempotency(reqCrash, res, next);

  // We mock a controller execution that throws
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Payment.create([{ company: company._id, distributor: distributor._id, amount: 300, method: 'CASH', createdBy: user._id }], { session });
        throw new Error('Simulated Database Crash!');
      });
    } finally {
      session.endSession();
    }
  } catch(e) {
    console.log("Caught crash successfully.");
    // Mark FAILED manually since the mock controller bypassed the normal response interceptor
    reqCrash.idempotencyRecord.status = 'FAILED';
    await reqCrash.idempotencyRecord.save();
  }

  let dCrash = await Distributor.findById(distributor._id);
  console.log(`Balance after crash: ${dCrash.outstandingBalance}`);
  if (dCrash.outstandingBalance !== 1000) throw new Error("Balance should remain 1000 after abort");

  // Now retry properly
  console.log("Retrying crashed request properly...");
  const resRetry = { status: function(code) { this.statusCode = code; return this; }, json: function(data) { this.data = data; return this; } };
  await withIdempotency(reqCrash, resRetry, next);
  await recordPayment(reqCrash, resRetry, next);

  let dRetry = await Distributor.findById(distributor._id);
  console.log(`Balance after successful retry: ${dRetry.outstandingBalance}`);
  if (dRetry.outstandingBalance !== 700) throw new Error("Balance should be 700 after retry success");

  // --- Test 4: Simulated crash AFTER commit but before HTTP response ---
  console.log("\n--- Test: Simulated Crash AFTER Commit ---");
  const reqCrashAfter = makeReq('crash-after-key', 100);
  await withIdempotency(reqCrashAfter, res, next);

  const session2 = await mongoose.startSession();
  try {
    await session2.withTransaction(async () => {
      await Payment.create([{ company: company._id, distributor: distributor._id, amount: 100, method: 'CASH', createdBy: user._id }], { session: session2 });
      await Distributor.updateOne({ _id: distributor._id }, { $inc: { outstandingBalance: -100 } }, { session: session2 });

      // Crucial: we save the COMPLETION state IN the transaction!
      reqCrashAfter.idempotencyRecord.status = 'COMPLETED';
      reqCrashAfter.idempotencyRecord.responseBody = { success: true, data: { msg: "mock" } };
      reqCrashAfter.idempotencyRecord.responseStatus = 201;
      await reqCrashAfter.idempotencyRecord.save({ session: session2 });
    });
  } finally {
    session2.endSession();
  }

  // Assume the node process crashes RIGHT HERE before res.json() reaches the user.
  console.log("Node process crashed before returning HTTP response. User retries.");

  const resRetryAfter = { status: function(code) { this.statusCode = code; return this; }, json: function(data) { this.data = data; return this; } };

  await withIdempotency(reqCrashAfter, resRetryAfter, next);
  console.log(`Retry status code: ${resRetryAfter.statusCode}`);

  let dRetryAfter = await Distributor.findById(distributor._id);
  console.log(`Balance: ${dRetryAfter.outstandingBalance}`);

  if (dRetryAfter.outstandingBalance !== 600) throw new Error("Balance should be 600");
  if (resRetryAfter.statusCode !== 201) throw new Error("Should return cached 201");

  console.log("\n✅ All crash safety tests passed.");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});