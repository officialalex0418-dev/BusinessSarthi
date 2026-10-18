import mongoose from 'mongoose';
import assert from 'assert';
import { env } from './src/config/env.js';
import { IdempotencyKey, Company, User } from './src/models/index.js';
import { withIdempotency } from './src/middleware/idempotency.js';

async function runIdempotencyTests() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to DB for Idempotency tests");

  const company = await Company.findOne({});
  const user = await User.findOne({ company: company._id });

  if (!company || !user) {
    console.log("Required test data missing. Skipping tests.");
    process.exit(0);
  }

  // Clear existing keys
  await IdempotencyKey.deleteMany({ company: company._id });

  const mockRequest = (key, payload) => ({
    headers: { 'x-idempotency-key': key },
    body: payload,
    user: { _id: user._id },
    companyId: company._id,
    path: '/api/v1/test-operation',
    method: 'POST'
  });

  const mockResponse = () => {
    const res = {
      status: function (s) { this.statusCode = s; return this; },
      json: function (data) { this.body = data; return this; }
    };
    return res;
  };

  let nextCalled = false;
  let nextError = null;
  const next = (err) => {
    nextCalled = true;
    nextError = err;
  };

  // Test 1: First request processes normally
  console.log("Test 1: First request");
  const req1 = mockRequest('key-123', { amount: 100 });
  const res1 = mockResponse();
  nextCalled = false; nextError = null;

  await withIdempotency(req1, res1, next);
  assert.strictEqual(nextError || null, null, "Should not throw an error on first request");
  assert.strictEqual(nextCalled, true, "Next should be called");

  // Simulate controller finishing successfully
  res1.status(201).json({ success: true, message: "Payment added" });

  // Wait a moment for background save
  await new Promise(r => setTimeout(r, 200));

  const keyRecord = await IdempotencyKey.findOne({ key: 'key-123' });
  assert.strictEqual(keyRecord.status, 'COMPLETED', "Status should be COMPLETED");
  assert.strictEqual(keyRecord.responseStatus, 201, "Should save response status");
  assert.strictEqual(keyRecord.responseBody.message, "Payment added", "Should save response body");

  // Test 2: Second request with same key returns cached response
  console.log("Test 2: Reused key returns cached response");
  const req2 = mockRequest('key-123', { amount: 100 });
  const res2 = mockResponse();
  nextCalled = false; nextError = null;

  await withIdempotency(req2, res2, next);
  assert.strictEqual(nextCalled, false, "Next should NOT be called for duplicate request");
  assert.strictEqual(res2.statusCode, 201, "Should return cached 201 status");
  assert.strictEqual(res2.body.message, "Payment added", "Should return cached body");

  // Test 3: Second request with same key but different payload fails
  console.log("Test 3: Reused key with different payload fails");
  const req3 = mockRequest('key-123', { amount: 500 }); // different payload
  const res3 = mockResponse();
  nextCalled = false; nextError = null;

  await withIdempotency(req3, res3, next);
  assert.ok(nextError, "Should throw error for payload mismatch");
  assert.match(nextError.message, /different payload/i);

  // Test 4: Concurrent requests (IN_PROGRESS protection)
  console.log("Test 4: Concurrent requests protection");
  const req4 = mockRequest('key-456', { action: 'start' });
  const res4 = mockResponse();
  nextCalled = false; nextError = null;

  // Start the first one but DO NOT complete it (simulate long-running controller)
  await withIdempotency(req4, res4, next);
  assert.strictEqual(nextCalled, true, "Next called for 1st concurrent request");

  // Fire second request while the first is IN_PROGRESS
  const req5 = mockRequest('key-456', { action: 'start' });
  const res5 = mockResponse();
  let nextCalled5 = false;
  await withIdempotency(req5, res5, () => { nextCalled5 = true; });

  assert.strictEqual(nextCalled5, false, "Next should NOT be called for concurrent duplicate");
  assert.strictEqual(res5.statusCode, 409, "Should return 409 Conflict");
  assert.match(res5.body.message, /in progress/i);

  console.log("All Idempotency tests passed!");
  await mongoose.disconnect();
}

runIdempotencyTests().catch(err => {
  console.error(err);
  process.exit(1);
});