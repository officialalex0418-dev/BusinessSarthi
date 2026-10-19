import mongoose from 'mongoose';
import { env } from './src/config/env.js';

async function testTransactions() {
  await mongoose.connect(env.mongoUri, { maxPoolSize: 20 });
  console.log("Connected to MongoDB for transaction test.");

  const TestSchema = new mongoose.Schema({ name: String, value: Number });
  const TestModel = mongoose.model('TestModel', TestSchema);

  // Initialize collection (transactions cannot be run on nonexistent collections)
  await TestModel.createCollection();
  await TestModel.deleteMany({});

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    console.log("Transaction started.");

    await TestModel.create([{ name: 'Test', value: 1 }], { session });

    // Test abort
    await session.abortTransaction();
    console.log("Transaction aborted.");

    const countAfterAbort = await TestModel.countDocuments();
    console.log(`Count after abort: ${countAfterAbort} (expected 0)`);

    // Test commit
    session.startTransaction();
    await TestModel.create([{ name: 'Test2', value: 2 }], { session });
    await session.commitTransaction();
    console.log("Transaction committed.");

    const countAfterCommit = await TestModel.countDocuments();
    console.log(`Count after commit: ${countAfterCommit} (expected 1)`);

    console.log("Transactions ARE supported and working!");

  } catch (err) {
    console.error("Transactions are NOT working:", err.message);
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}

testTransactions();