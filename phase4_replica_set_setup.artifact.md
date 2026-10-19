# Phase 4: Isolated Replica-Set Test Environment

## 1. Files Created
- `backend/test-rs-data/` (Directory for isolated database files)
- `backend/start-mongod.js` (Node script to spawn the isolated mongod background process)
- `backend/init-rs.js` (Node script to initialize the replica set configuration `rs.initiate()`)
- `backend/test-replica-set.js` (Integration test proving commit, rollback, and standalone-failure behavior)

## 2. Environment Setup and Teardown
This environment operates purely on the host OS alongside the existing database, binding to a different port (`27018`).

**Start the Replica Set:**
1. Open a terminal in the root directory.
2. Run `node backend\start-mongod.js` (spawns `mongod.exe` on port 27018 detached in the background).
3. Run `node backend\init-rs.js` (sends the `replSetInitiate` command to activate the replica set).

**Stop the Replica Set:**
Because the process runs detached in the background, you can shut it down gracefully via the `mongosh` or programmatically:
1. Open `mongosh "mongodb://127.0.0.1:27018/admin"`
2. Run `db.adminCommand({ shutdown: 1 })`
*Note: Stopping this isolated instance has zero impact on the primary development database on port 27017.*

## 3. MongoDB Version and Status
- **MongoDB Version**: `8.2.5` (Windows)
- **Replica Set Name**: `rs0`
- **Port**: `27018`
- **Host**: `127.0.0.1`

## 4. Test Commands and Evidence
I authored `backend/test-replica-set.js` to execute strict transaction integration tests.

**Command 1: Run against the isolated Replica Set**
`node backend\test-replica-set.js`
*Output Evidence:*
```text
=== MongoDB Transaction Integration Test ===
Connecting to: mongodb://127.0.0.1:27018/transaction_test?replicaSet=rs0
Connected to MongoDB.
✅ Verified: Database is a replica set.

--- Test 1: Abort Transaction ---
Transaction explicitly aborted.
✅ Success: Neither write persisted after abort.

--- Test 2: Commit Transaction ---
Transaction explicitly committed.
✅ Success: Both related writes persisted atomically.
Cleanup: Test records removed.
✅ OVERALL RESULT: TESTS PASSED
```

**Command 2: Prove Standalone Deployments Fail Safely**
To prove that our tests actively catch non-replica set environments, I forced the test to target the original standalone database via environment variables:
`set MONGODB_TRANSACTION_TEST_URI=mongodb://localhost:27017/business_sarthi1 && node backend\test-replica-set.js`
*Output Evidence:*
```text
❌ ERROR: This database is NOT configured as a replica set!
Transactions require a replica set. The test will now attempt a transaction to verify it fails clearly.

--- Test 1: Abort Transaction ---
❌ Transaction failed with error:
Transaction numbers are only allowed on a replica set member or mongos
✅ Test successfully verified that transactions fail clearly on a standalone deployment.
```

## 5. Environment Isolation & Safety Confirmation
- The original standalone database (`mongodb://localhost:27017`) remains entirely unmodified and online.
- The `.env` variables and `env.js` configurations were **not** modified.
- The newly created `test-replica-set.js` selectively reads `MONGODB_TRANSACTION_TEST_URI` falling back to the isolated `27018` instance. Production code remains entirely untouched.
- The financial controllers (`distributor.controller.js`, `vendor.controller.js`, etc.) were not touched during this setup phase.

## 6. Limitations and Next Steps
**Limitations**:
This is a single-node replica set (`members: [{ _id: 0, host: 'localhost:27018' }]`). It allows Mongoose to acquire transaction locks and test atomic commits/rollbacks, but it cannot simulate distributed network partitions or multi-node consensus elections. For our application-level atomicity tests, a single node is sufficient.

**Status**:
The isolated replica set is running and verified!
We are now fully unblocked to begin converting the financial controllers to use `session.withTransaction()` on the `perf/phase4-atomicity` branch.