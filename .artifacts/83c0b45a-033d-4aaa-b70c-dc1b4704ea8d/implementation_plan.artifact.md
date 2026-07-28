# Implementation Plan - Resolve Persistent Crashes

I have identified the root causes of the crashes on the Customer List and Attendance pages. Both were caused by **missing component imports** and a lack of null-safety in the initial state logic.

## Proposed Changes

### 🛠️ Frontend Import & Stability Fixes

#### [MODIFY] [Company/Customers.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Customers.jsx)
- **RESTORE**: Re-add the accidentally removed React (`useEffect`, `useState`, `useCallback`) and Lucide-React (`Search`, `User`, etc.) imports.
- **VERIFY**: Ensure `Badge` is included in the `@/components/ui` import list.

#### [MODIFY] [Staff/Attendance.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/staff/Attendance.jsx)
- **ADD MISSING IMPORT**: Add `DatePicker` to the `@/components/ui` import list.
- **NULL SAFETY**: Add a null check for the `adToBs` result in the `useState` initializer for `selectedMonth` to prevent a crash if the calendar data is not yet ready.

#### [MODIFY] [lib/nepaliDate.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/lib/nepaliDate.js)
- **DEFENSIVE CODING**: Update `adToBs` to return a safe default object instead of `null` if timezone extraction fails. This will prevent "cannot read property of null" errors across the entire app.

## Verification Plan

### Manual Verification
- **Attendance Page**: Navigate to the staff panel and verify the page loads instantly. Open the "Overtime Request" and ensure the DatePicker works.
- **Customer List**: Navigate to the company panel and verify the "Customer List" renders with Town and Employee data.
- **Filters**: Test the Town and Employee filters in the Customer List.
