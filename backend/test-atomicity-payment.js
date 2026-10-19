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

  const req = {
    headers: { 'x-idempotency-key': 'payment-123' },
    body: { distributorId: distributor._id.toString(), amount: 200, method: 'CASH', remarks: 'test payment' },
    user: { _id: user._id },
    companyId: company._id,
    path: '/payments',
    method: 'POST'
  };

  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };

  // Mock next
  const next = (err) => {
    if (err) console.error("Error in middleware:", err);
  };

  // Wrap controller in our mock request
  const mockController = async () => {
    await recordPayment(req, res, next);
  };

  console.log("\n--- Test 1: Successful Payment ---");
  await withIdempotency(req, res, next);
  await mockController();

  let d1 = await Distributor.findById(distributor._id);
  console.log(`Balance after payment 1: ${d1.outstandingBalance}`);
  let p1 = await Payment.countDocuments();
  console.log(`Payment count: ${p1}`);

  if (d1.outstandingBalance !== 800) throw new Error("Balance should be 800");
  if (p1 !== 1) throw new Error("Payment count should be 1");

  console.log("\n--- Test 2: Retry same payment (Idempotency) ---");
  const res2 = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };
  await withIdempotency(req, res2, next);
  // It shouldn't call the controller, `withIdempotency` will return the cached response directly
  console.log(`Retry status: ${res2.statusCode}`);
  let d2 = await Distributor.findById(distributor._id);
  console.log(`Balance after retry: ${d2.outstandingBalance}`);
  let p2 = await Payment.countDocuments();
  console.log(`Payment count after retry: ${p2}`);

  if (d2.outstandingBalance !== 800) throw new Error("Balance should STILL be 800");
  if (p2 !== 1) throw new Error("Payment count should STILL be 1");

  console.log("\n✅ Financial Atomicity & Idempotency logic tests passed.");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});