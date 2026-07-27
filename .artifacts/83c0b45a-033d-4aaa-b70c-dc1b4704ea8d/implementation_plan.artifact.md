# Implementation Plan - UI Enhancements, Session Management & Payroll Refactor

This plan outlines the changes to display user designations, configure session timeouts for mobile and web, and enhance the payroll editing experience.

## User Review Required

> [!IMPORTANT]
> The session timeout for web is already set to 30 minutes in the frontend (inactivity detection). I will ensure the backend cookie `maxAge` also aligns with this for consistency.

## Proposed Changes

### 🔐 Authentication & Session Management
#### [MODIFY] [auth.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/auth.controller.js)
- Ensure mobile session `maxAge` is exactly 30 days (`30 * 24 * 60 * 60 * 1000`).
- Ensure web session `maxAge` is exactly 30 minutes (`30 * 60 * 1000`).

#### [MODIFY] [DashboardLayout.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/layouts/DashboardLayout.jsx)
- Verify `idleTimeoutMs` is set to `30 * 60 * 1000` (30 minutes).

### 🏷️ User Interface Enhancements
#### [MODIFY] [dashboard.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/dashboard.controller.js)
- Update `staffDashboard` to include `designationName: req.user.designation?.name` in the returned `profile` data.

#### [MODIFY] [DashboardLayout.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/layouts/DashboardLayout.jsx)
- In the top header (User menu), display the user's designation name (if available) below their name.

#### [MODIFY] [Dashboard.jsx (Staff)](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/staff/Dashboard.jsx)
- Update the profile header to display the designation name instead of just the generic "position".

### 💰 Payroll Module Refactor
#### [MODIFY] [payroll.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/payroll.controller.js)
- Update `updatePayroll` to allow manual overrides for `deductions.absent` and `deductions.tax`.
- If these are provided in `req.body`, prioritize them over the automatic calculation.

#### [MODIFY] [PayrollManager.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/components/PayrollManager.jsx)
- Convert "Absent Deduction", "Tax Deduction", and "Total Allowances" from read-only displays to editable `Input` fields.
- Update the `saveDetail` function to send all manually edited values to the backend.

## Verification Plan

### Manual Verification
- **UI**: Log in as a staff member and verify the designation is visible on the dashboard and in the top right header.
- **Sessions**: Log in on web and wait 30 minutes without activity; verify auto-logout occurs.
- **Payroll**: Open a payroll report, manually change the Tax or Absent deduction values, click "Save Changes", and verify the Net Salary updates and persists correctly.
