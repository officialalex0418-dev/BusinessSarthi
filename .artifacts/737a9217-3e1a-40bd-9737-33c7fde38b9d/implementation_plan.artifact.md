# Implementation Plan - Fix Designation Permissions Access

Fix the issue where employees with specific designations and permissions cannot access the corresponding sections in the app. This involves fixing a broken RBAC middleware on the backend and updating navigation logic on the frontend.

## User Review Required

> [!IMPORTANT]
> The backend fix involves cleaning up a significantly corrupted logic block in the `rbac.js` middleware. I will ensure that the logic correctly separates "Self-service" actions (which all staff can do) from "Management" actions (which require specific designation permissions).

## Proposed Changes

### Backend

#### [MODIFY] [rbac.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/middleware/rbac.js)
- Fix the `path.startsWith('/leaves')` block to remove unrelated sales logic and undefined variables.
- Add a proper `path.startsWith('/sales')` block to handle `salesEntry` and `salesTracker` permissions.
- Ensure `customerMasterList` and `inventory` permissions are correctly mapped to their respective route paths.

### Frontend

#### [MODIFY] [App.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/App.jsx)
- Update navigation filtering logic for `Staff App` to respect `salesEntry` permission for the "Sales Entry" link.
- Ensure "Customer Master List" link respects the `customerMasterList` permission.
- Verify that "Management" section links for staff with delegated permissions (e.g., `Employee Mgmt`, `Attendance Mgmt`) correctly appear based on designation permissions.

## Verification Plan

### Automated Tests
- I will verify the code changes for syntax errors.
- Manual verification of the logic flow in `rbac.js`.

### Manual Verification
- Log in as a `STAFF` user with a Designation that has specific permissions (e.g., `salesEntry`).
- Verify that the "Sales Entry" link is visible.
- Verify that clicking the link loads the page and allows the API call.
- Log in as a `STAFF` user with `liveTracking` permission and verify they can see "Tracking Mgmt" in their sidebar.
