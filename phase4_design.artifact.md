# Phase 4: Financial Atomicity & Transaction Safety Design

## 1. Affected Endpoints and Files
**Files:**
- `backend/src/controllers/distributor.controller.js`
- `backend/src/controllers/purchase.controller.js`
- `backend/src/controllers/vendor.controller.js`

**Endpoints:**
- `POST /sales-invoices` (`createInvoice`)
- `POST /payments` (`recordPayment`)
- `POST /purchases` (`createPurchase`)
- `POST /vendor-payments` (`recordVendorPayment`)

## 2. Exact Failure Scenarios
The operations currently execute sequential, dependent writes without multi-document guarantees.
For example, in `recordPayment`:
1. `Payment.create(...)`
2. `distributor.outstandingBalance -= amount; await distributor.save();`

If the Node.js process crashes, encounters an OOM exception, or loses DB connection *after* Step 1 but *before* Step 2, the payment is recorded in the ledger but the distributor's balance is never reduced. Because the request failed, the client receives a 500 error or timeout. The Idempotency key remains stuck in `FAILED` or `IN_PROGRESS` (if TTL hasn't wiped it). On retry, a duplicate payment is created, further skewing the financial state.

## 3. MongoDB Transaction Support on Staging
**Result: UNAVAILABLE ON LOCAL STAGING**
I ran an isolated transaction integration test (`test-transactions.js`). It threw the error:
`Transactions are NOT working: Transaction numbers are only allowed on a replica set member or mongos`.
The local `.env` staging database is a standalone instance (`mongodb://localhost:27017/business_sarthi1`). MongoDB explicitly blocks multi-document transactions on standalone instances. While production (Atlas M0) natively uses replica sets and supports them, we **cannot** safely verify multi-document transactions in our current isolated staging environment.

## 4. Proposed Alternatives & Trade-offs
Since we cannot verify multi-document transactions locally, we have two paths:

### Alternative A: Conditional Atomic Updates (Two-Phase Commit Pattern)
Embed a unique `transactionId` (or use the Idempotency Key) into the financial operation.
- **Trade-offs**: Requires schema changes (`processedTransactions` array on Distributor/Vendor/Inventory). Arrays can grow unbounded, requiring cleanup. It guarantees exactly-once processing but complicates the controllers significantly.

### Alternative B: Idempotency-Driven Recovery Workflow (Chosen Approach)
Use the existing `IdempotencyKey` record as a durable write-ahead log (WAL).
1. When a request begins, `IdempotencyKey` is created with `status = 'IN_PROGRESS'`.
2. Generate predetermined `_id`s for the models (e.g., `paymentId = new mongoose.Types.ObjectId()`).
3. Save these `_id`s onto the `IdempotencyKey` record *before* executing the business logic (e.g., `IdempotencyKey.recoveryData = { paymentId }`).
4. Execute the business logic using `upsert` or `$set` operations, ensuring they are idempotent.
5. If the process crashes, the next retry loads the `IdempotencyKey`. It detects the crash (`status === 'FAILED'` or stuck `IN_PROGRESS`), reads the predetermined `paymentId`, and resumes the operation safely without duplicating the records.

### Alternative C: Convert Local to Replica Set
(Blocked by infrastructure constraints - we cannot modify the host system's database architecture safely).

## 5. Idempotency Lifecycle Changes Required
To safely recover without transactions, the Idempotency middleware must:
1. Accept an optional `recoveryData` payload.
2. If a request is retried after a `FAILED` state, pass the `recoveryData` back to the controller so the controller can resume the partial write rather than starting fresh.

## 6. Risks and Rollback Plan
**Risks**:
- Implementing manual two-phase recovery is complex and error-prone compared to native `session.withTransaction()`.
- If production *does* support transactions, we are over-engineering a workaround for a local dev environment limitation.

**Rollback Plan**:
- Discard the `perf/phase4-atomicity` branch.
- Revert `IdempotencyKey` schema changes.

---
**STATUS: BLOCKED PENDING CTO DECISION.**
Please advise if we should proceed with Alternative B (Manual Recoverable Workflow), or if we are permitted to upgrade the local staging DB to a Replica Set to utilize native MongoDB Transactions.