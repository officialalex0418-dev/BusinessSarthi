# Implementation Plan - Fix Overtime Request Permissions

This plan resolves the "Access denied" error when staff members attempt to submit an overtime request.

## Proposed Changes

### 🔐 Security Middleware Fix

#### [MODIFY] [rbac.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/middleware/rbac.js)
- Update the `isSelf` logic for the `/attendance` path.
- Include `path.includes('/requests')` in the "Self-Service" bypass, but only for:
    - `POST` requests (creating a new request).
    - `GET` requests to `/attendance/requests/me` (viewing their own history).
- This ensures staff can manage their own requests without needing full "Attendance Management" permissions to see everyone else's data.

## Verification Plan

### Manual Verification
- **Submit Request**: Log in as a staff member (without managerial attendance permissions) and click "Request Overtime". Verify the request is submitted successfully and the "Access denied" message no longer appears.
- **View My Requests**: Navigate to the attendance history and ensure your own requests are visible.
- **Management Guard**: Log in as staff and try to access the manager's attendance list (if a link exists); verify it is still blocked as intended.
