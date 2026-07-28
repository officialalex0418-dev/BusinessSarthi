# Implementation Plan - Fix Crashes & Finalize Customer Module

This plan focuses on resolving the "white screen" crashes on the Customer List and Attendance pages by fixing missing imports and adding robust null-safety.

## Proposed Changes

### 🛠️ Frontend Crash Fixes

#### [MODIFY] [Company/Customers.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Customers.jsx)
- **CRITICAL**: Add `Badge` to the list of components imported from `@/components/ui`. This is the primary cause of the crash on this page.
- Add additional safety checks for `data.items` and `c.createdBy`.

#### [MODIFY] [Staff/Attendance.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/staff/Attendance.jsx)
- Add null-safety to `data.summary` usage (e.g., `data.summary?.presentDays || 0`).
- Ensure `Table` data prop always receives an array using `data?.items || []`.
- Wrap the initial state logic for `selectedMonth` in a try-catch block for extra resilience.

#### [MODIFY] [nepaliDate.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/lib/nepaliDate.js)
- Enhance `adToBs` to be even more defensive against environments where `Intl.DateTimeFormat` might behave unexpectedly.

### 🏘️ Customer Module Refinement
- Verify that the `town` field is correctly displayed and searchable in both Staff and Company views.

## Verification Plan

### Manual Verification
- **Company Panel**: Navigate to `/company/customers`. Verify the "white screen" is gone and the table loads with Town and Added By info.
- **Staff Panel**: Navigate to `/staff/attendance`. Verify the page renders correctly and the monthly summary counts are visible.
- **Filters**: Test the Town and Employee filters in the Company Customer List again.
