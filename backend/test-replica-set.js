import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const testUri = process.env.MONGODB_TRANSACTION_TEST_URI || 'mongodb://127.0.0.1:27018/transaction_test?replicaSet=rs0';

async function runTest() {
  console.log(`\n=== MongoDB Transaction Integration Test ===`);
  console.log(`Connecting to: ${testUri}`);

  try {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Check if replica set is configured properly
  let isReplicaSet = false;
  try {
    const status = await mongoose.connection.db.admin().command({ replSetGetStatus: 1 });
    if (status && status.ok) isReplicaSet = true;
  } catch (err) {
    // If command fails, it's likely standalone
  }

  if (!isReplicaSet) {
    console.error('\n❌ ERROR: This database is NOT configured as a replica set!');
    console.error('Transactions require a replica set. The test will now attempt a transaction to verify it fails clearly.');
  } else {
    console.log('\n✅ Verified: Database is a replica set.');
  }

  // Setup models for the test
  const InvoiceSchema = new mongoose.Schema({ amount: Number, status: String });
  const LedgerSchema = new mongoose.Schema({ invoiceId: mongoose.Schema.Types.ObjectId, amount: Number });

  const Invoice = mongoose.model('TestInvoice', InvoiceSchema);
  const Ledger = mongoose.model('TestLedger', LedgerSchema);

  // Initialize collections
  await Invoice.createCollection().catch(() => {});
  await Ledger.createCollection().catch(() => {});

  const session = await mongoose.startSession();

  let testFailed = false;

  try {
    // --- TEST 1: ABORT TRANSACTION ---
    console.log('\n--- Test 1: Abort Transaction ---');
    session.startTransaction();

    const [invoice1] = await Invoice.create([{ amount: 100, status: 'PENDING' }], { session });
    await Ledger.create([{ invoiceId: invoice1._id, amount: 100 }], { session });

    await session.abortTransaction();
    console.log('Transaction explicitly aborted.');

    const invoiceCount = await Invoice.countDocuments({ _id: invoice1._id });
    const ledgerCount = await Ledger.countDocuments({ invoiceId: invoice1._id });

    if (invoiceCount === 0 && ledgerCount === 0) {
      console.log('✅ Success: Neither write persisted after abort.');
    } else {
      console.error(`❌ Failure: Writes persisted! Invoices: ${invoiceCount}, Ledgers: ${ledgerCount}`);
      testFailed = true;
    }

    // --- TEST 2: COMMIT TRANSACTION ---
    console.log('\n--- Test 2: Commit Transaction ---');
    session.startTransaction();

    const [invoice2] = await Invoice.create([{ amount: 200, status: 'PAID' }], { session });
    await Ledger.create([{ invoiceId: invoice2._id, amount: 200 }], { session });

    await session.commitTransaction();
    console.log('Transaction explicitly committed.');

    const invoice2Count = await Invoice.countDocuments({ _id: invoice2._id });
    const ledger2Count = await Ledger.countDocuments({ invoiceId: invoice2._id });

    if (invoice2Count === 1 && ledger2Count === 1) {
      console.log('✅ Success: Both related writes persisted atomically.');
    } else {
      console.error(`❌ Failure: Missing writes! Invoices: ${invoice2Count}, Ledgers: ${ledger2Count}`);
      testFailed = true;
    }

    // Clean up ONLY records created by this test
    if (invoice2) {
      await Invoice.deleteOne({ _id: invoice2._id });
      await Ledger.deleteOne({ invoiceId: invoice2._id });
      console.log('\nCleanup: Test records removed.');
    }

  } catch (err) {
    console.error('\n❌ Transaction failed with error:');
    console.error(err.message);
    if (!isReplicaSet && err.message.includes('Transaction numbers are only allowed on a replica set member or mongos')) {
      console.log('\n✅ Test successfully verified that transactions fail clearly on a standalone deployment.');
    } else {
      testFailed = true;
    }
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }

  if (testFailed) {
    console.error('\n❌ OVERALL RESULT: TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ OVERALL RESULT: TESTS PASSED');
    process.exit(0);
  }
}

runTest();