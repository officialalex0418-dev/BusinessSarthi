# Implementation Plan - Customer Management & Attendance Fix

This plan addresses the crash on the staff attendance page and adds the requested "Town" field and company-wide customer list.

## Proposed Changes

### 🔐 Stability Fixes
#### [MODIFY] [ui/index.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/components/ui/index.jsx)
- Add safety checks to `toLocalDateString` and `DatePicker` to handle missing settings or invalid dates.
- Ensure `DatePicker` doesn't attempt to render the BS calendar if `user` or `settings` are not yet loaded.

### 👥 Customer Module Enhancements
#### [MODIFY] [Customer.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/models/Customer.js)
- Add `town: { type: String, trim: true }` field to the schema.

#### [MODIFY] [validators.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/routes/validators.js)
- Update `customerBody` schema to include `town` (optional string).

#### [MODIFY] [customer.controller.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/controllers/customer.controller.js)
- Update `listCustomers`:
    - Support filtering by `town` and `createdBy` (employee ID).
    - Populate `createdBy` with employee `name`.
    - Enhance search to include `town`.

#### [MODIFY] [Customers.jsx (Staff)](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/staff/Customers.jsx)
- Add "Town" field to the add/edit customer form.
- Display "Town" in the customer table.

#### [NEW] [Customers.jsx (Company)](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Customers.jsx)
- Create a new page for company owners/managers to view all customers.
- Implement filters for "Town" and "Employee" (Created By).
- Show which staff member added each customer.

### 🚀 Navigation & Routing
#### [MODIFY] [App.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/App.jsx)
- Register the new `/company/customers` route.
- Add "Customer List" to the sidebar menu for Company Owners and Managers.

## Verification Plan

### Manual Verification
- **Attendance**: Navigate to the staff attendance page and verify it loads correctly without crashing. Open the Overtime Request modal and test the date picker.
- **Customer Form**: Add a new customer as staff and fill in the "Town" field. Verify it saves and displays.
- **Company List**: Log in as a company owner, navigate to "Customer List", and verify you can see all customers.
- **Filtering**: Test filtering the customer list by a specific Town and a specific Employee.
