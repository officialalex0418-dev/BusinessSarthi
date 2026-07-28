# Implementation Plan - UI Refinement, Tracking Logic & Attendance Rules

This plan addresses several UX improvements, enforces stricter tracking and attendance rules, and enhances the designation permission system.

## Proposed Changes

### 🏷️ UI Renaming & Responsiveness
#### [MODIFY] [App.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/App.jsx)
- Rename sidebar label "Customer List" to "Customer Master List" for company panels.

#### [MODIFY] [company/Customers.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Customers.jsx)
- Update page title to "Customer Master List".
- Improve grid responsiveness for the filter section (use `sm:grid-cols-2 lg:grid-cols-4`).

### 🔐 Designation & Permissions
#### [MODIFY] [Designation.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/models/Designation.js)
- Add `salesEntry` and `customerMasterList` to the `permissions` schema.

#### [MODIFY] [company/Designations.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Designations.jsx)
- Add "Sales Entry" and "Customer Master List" checkboxes to the designation form.

#### [MODIFY] [rbac.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/middleware/rbac.js)
- Update permission checks:
    - Use `permissions.salesEntry` for `/sales` POST requests.
    - Use `permissions.customerMasterList` for the combined customer list view in the company panel.

### 📍 Location Tracking Enhancements
#### [MODIFY] [auth.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/auth.controller.js)
- Update `me` and `login` to include `isCheckedIn` status for the current day.

#### [MODIFY] [DashboardLayout.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/layouts/DashboardLayout.jsx)
- Update `isTrackingEnabled`: Only enable if `user.role === 'STAFF'` AND `user.isCheckedIn` is true.

#### [MODIFY] [LiveTracking.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/LiveTracking.jsx)
- Add a 1-minute `setInterval` to call `loadLive()` to ensure the map/list refreshes even without socket activity.

#### [MODIFY] [location.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/location.controller.js)
- Increase `$sample` size in `heatmap` to 10,000 for more detailed visualization.

### 👥 Staff & Attendance Rules
#### [MODIFY] [StaffManager.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/components/StaffManager.jsx)
- Make the "Shift" field **required** in the employee registration form.

#### [MODIFY] [attendance.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/attendance.controller.js)
- Update `checkOut` logic: Change `thresholdMinutes` calculation from 50% to **40%** of the shift duration to determine Half Day status.

## Verification Plan

### Manual Verification
- **Renaming**: Verify the sidebar and page headers show "Customer Master List".
- **Permissions**: Create a designation with only "Sales Entry" and verify that user cannot see the "Customer Master List".
- **Tracking Logic**: Log in as staff; verify tracking notification only appears AFTER check-in.
- **Attendance**: Perform a check-out after working 45% of a shift and verify status is "PRESENT". Perform it after 35% and verify "HALF_DAY".
- **Staff Form**: Try registering a staff member without a shift and verify the form blocks submission.
