# Implementation Plan - Fix Profile Upload & Designation-Based Access

This plan addresses three key issues: fixing the staff profile photo upload and profile edit functionality, removing the "Base System Role" from designations to simplify management, and ensuring staff access is driven primarily by their designation's granular permissions.

## Proposed Changes

### 🔌 Backend (API)

#### [MODIFY] [misc.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/misc.controller.js)
- Update `updateMyProfile` to allow updating `name`, `address`, and `pan` in addition to `phone` and `profilePhoto`.
- Ensure `profilePhoto` base64 upload logic remains robust.

#### [MODIFY] [rbac.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/middleware/rbac.js)
- Update `authorize` middleware: When a user has a designation and `permissionGranted` is `true`, allow access even if the route is typically restricted to `COMPANY_MANAGER` or `COMPANY_OWNER` and the user's role is `STAFF`. This fulfills the requirement that "Staff will get access as per their designation".

#### [MODIFY] [staff.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/staff.controller.js)
- In `createStaff` and `updateStaff`, stop deriving the user's `role` from `designation.baseRole`.
- Default new company staff to `ROLES.STAFF` if no role is explicitly provided.

### 🌐 Frontend (Dashboard)

#### [MODIFY] [EditProfile.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/staff/EditProfile.jsx)
- Disable the `email` input field in the profile edit form to prevent accidental lockouts or conflicts, as email is the primary login identifier.

#### [MODIFY] [Designations.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Designations.jsx)
- Remove the "Base System Role" selection field from the New/Edit Designation modal.
- Set the default `baseRole` in `emptyForm` to `STAFF`.
- Remove "Base Role" column from the designations table as it's no longer a relevant configuration for the user.

## Verification Plan

### Automated Tests
- Test profile update via API with all fields (`name`, `pan`, `address`, `profilePhoto`) and verify database updates.
- Test a `STAFF` user with a designation that has `staff` permission and verify they can access the `/staff` management routes.

### Manual Verification
- **Profile**: Upload a new profile photo and edit details as a staff member; verify they persist.
- **Designation**: Create a new designation without selecting a base role, assign it to a staff member, and verify their access level in the app matches the selected permissions.
