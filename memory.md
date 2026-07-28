# Business Sarthi - Development Memory

This file tracks the architectural changes, refactors, and feature implementations performed on the Business Sarthi project.

## Completed Tasks

### ☁️ Infrastructure & Backend Optimization
- **Cloudflare-Northflank Migration**: Refactored the architecture to support Production deployment on Northflank (Backend) and Cloudflare Pages (Frontend).
- **CORS & Security**: Updated CORS whitelist to support `https://app.bussinesssarthi.com` and mobile origin `capacitor://localhost`. Set `trust proxy` to 1 for Cloudflare compatibility.
- **Environment Strictness**: Removed localhost/127.0.0.1 defaults in production for security.
- **Email Service**: Prioritized Resend API over SMTP for reliable production delivery.
- **R2 Storage Proxy**: Implemented a secure backend proxy (`/api/v1/files/...`) to serve private Cloudflare R2 files (logos/profiles) to the web and mobile apps.

### 📱 UI & Mobile Responsiveness
- **Inventory Page**: Implemented a responsive grid for action buttons (Sales ON/OFF, Invoice, etc.) and stacked layout for filters to prevent horizontal overflow on mobile.
- **Staff Manager**: Refactored employee cards to use a 2x2 grid for action buttons on mobile, preventing text overlap and improving tap targets.
- **Settings Page**: Fixed profile header overlap where the "Edit Profile" button was colliding with the company logo. Optimized logo and header sizing for smaller screens.

### 🔐 Auth & Permissions Refactor
- **Session Policies**: Standardized sessions to 30 days for mobile devices and 30 minutes of inactivity for web users.
- **User Identity**: Integrated Designation display into the Staff Dashboard and the global top-bar header.
- **Designation System**: Removed the confusing "Base System Role" field. Designations are now fully driven by granular **Access Permissions**.
- **RBAC Logic**: Updated middleware to grant access based on designation permissions even for users with the `STAFF` role.
- **Staff Profile**: Fixed staff profile photo upload functionality and added support for updating Name, Address, and PAN fields. Disabled the email field in profile edits to prevent login conflicts.

### 📊 Core Module Enhancements
- **Stability Fixes**: Resolved critical crashes on the Staff Attendance page and Company Customer List by fixing missing `Badge` imports and adding robust null-safety for dashboard summary data.
- **Customer Management**: Added a "Town" field to customers and created a centralized "Customer List" for the company panel. Implemented town and employee filters to track field activity across all staff.
- **Attendance Stability**: Fixed a critical crash on the staff attendance page by adding safety checks to date formatting and the Nepali (BS) calendar components.
- **Flexible Payroll**: Made every field in the payroll detail report editable (Absent Deduction, Tax, Allowances, etc.). Updates now persist correctly on save.
- **Inventory "Add Product" Upgrade**: Refactored the Add Product form to support searching existing inventory and auto-filling details (Batch, Price, MRP). Added a seamless "+ Add New Product" workflow.
- **Smart Inventory Sync**: Invoices now auto-adjust inventory levels on update (reversing old quantities and applying new ones).
- **Professional Reporting**: Refactored Excel and PDF generation. Excels now feature frozen panes, merged titles, bold headers, and alternate row shading. PDFs now include business-standard headers and formal signatory footers.
- **Vendor Payment tracking**: Added Cheque Number and Bank Name fields to vendor payments for better tracking.
- **RBAC Refinement**: Fixed a "Role Mismatch" bug where staff with delegated permissions couldn't record vendor payments or update sales invoices.
- **BS Date Support**: Overtime requests now correctly use the company's preferred calendar (AD or BS) via a new DatePicker integration.

### 🚀 DevOps & CI/CD
- **Build Fix**: Resolved a syntax error in `Designations.jsx` (redundant `<td>` content) that was causing the frontend build to fail in CI/CD.
