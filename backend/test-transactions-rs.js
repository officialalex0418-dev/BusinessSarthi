import mongoose from 'mongoose';

const URI = 'mongodb://127.0.0.1:27018/transaction_test?replicaSet=rs0';

async function runTest() {
  console.log(`Connecting to ${URI}...`);
  await mongoose.connect(URI);
  console.log('Connected to replica set.');

  const TestSchema = new mongoose.Schema({ name: String, value: Number });
  const TestModel = mongoose.model('TestModelRs', TestSchema);

  // Initialize collection (transactions cannot be run on nonexistent collections)
  await TestModel.createCollection();
  await TestModel.deleteMany({});

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    console.log("Transaction started.");

    await TestModel.create([{ name: 'AbortItem', value: 1 }], { session });

    // Test abort
    await session.abortTransaction();
    console.log("Transaction aborted.");

    const countAfterAbort = await TestModel.countDocuments();
    console.log(`Count after abort: ${countAfterAbort} (expected 0)`);
    if (countAfterAbort !== 0) throw new Error('Abort failed!');

    // Test commit
    session.startTransaction();
    await TestModel.create([{ name: 'CommitItem', value: 2 }], { session });
    await session.commitTransaction();
    console.log("Transaction committed.");

    const countAfterCommit = await TestModel.countDocuments();
    console.log(`Count after commit: ${countAfterCommit} (expected 1)`);
    if (countAfterCommit !== 1) throw new Error('Commit failed!');

    console.log("✅ Transactions ARE supported and working on test replica set!");

  } catch (err) {
    console.error("❌ Transactions test failed:", err.message);
    process.exit(1);
  } finally {
    session.endSession();
    // Clean up
    await TestModel.collection.drop();
    await mongoose.disconnect();
  }
}

runTest();