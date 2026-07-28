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
- **Self-Service Requests**: Fixed a security bypass in `rbac.js` to allow staff to submit Overtime Requests without requiring full Attendance Management permissions.
- **Designation Permission Fix**: Resolved a critical bug where staff with specific designation permissions (Sales Entry, Customer List, etc.) were unable to access their respective modules. Fixed corrupted RBAC logic in `rbac.js` and updated frontend navigation filtering in `App.jsx` to respect these granular permissions.
- **Session Policies**: Standardized sessions to 30 days for mobile devices and 30 minutes of inactivity for web users.
- **User Identity**: Integrated Designation display into the Staff Dashboard and the global top-bar header.
- **Designation System**: Removed the confusing "Base System Role" field. Designations are now fully driven by granular **Access Permissions**.
- **RBAC Logic**: Updated middleware to grant access based on designation permissions even for users with the `STAFF` role.
- **Staff Profile**: Fixed staff profile photo upload functionality and added support for updating Name, Address, and PAN fields. Disabled the email field in profile edits to prevent login conflicts.

### 📊 Core Module Enhancements
- **Refined Tracking & Attendance**:
    - Restricted background tracking to active shifts only (between Check-In and Check-Out).
    - Updated Live Tracking to refresh every 60 seconds for near real-time monitoring.
    - Implemented a more flexible **40% Half-Day rule** (status becomes Half-Day only if worked hours are < 40% of shift duration).
    - Mandated **Shift Assignment** for all new employees to ensure accurate attendance tracking.
- **Customer Master List**: Rebranded the combined customer view and enhanced its responsiveness. Added granular **Sales Entry** and **Customer Master List** permissions to the designation system.
- **Final Stability Fixes**: Resolved persistent white-screen crashes on Attendance and Customer List pages by restoring missing imports (`DatePicker`, `Badge`, React hooks) and adding extreme null-safety to the Bikram Sambat (BS) date conversion logic.
- **Attendance Stability**: Fixed a critical crash on the staff attendance page by adding safety checks to date formatting and the Nepali (BS) calendar components.
- **Flexible Payroll**: Made every field in the payroll detail report editable (Absent Deduction, Tax, Allowances, etc.). Updates now persist correctly on save.
- **Inventory "Add Product" Upgrade**: Refactored the Add Product form to support searching existing inventory and auto-filling details (Batch, Price, MRP). Added a seamless "+ Add New Product" workflow.
- **Smart Inventory Sync**: Invoices now auto-adjust inventory levels on update (reversing old quantities and applying new ones).
- **Professional Reporting**: Refactored Excel and PDF generation. Excels now feature frozen panes, merged titles, bold headers, and alternate row shading. PDFs now include business-standard headers and formal signatory footers.
- **Vendor Payment tracking**: Added Cheque Number and Bank Name fields to vendor payments for better tracking.
- **RBAC Refinement**: Fixed a "Role Mismatch" bug where staff with delegated permissions couldn't record vendor payments or update sales invoices.
- **BS Date Support**: Overtime requests now correctly use the company's preferred calendar (AD or BS) via a new DatePicker integration.

### 🔍 Codebase Analysis & Knowledge Base
- **Deep Analysis**: Performed a comprehensive analysis of the entire codebase, covering backend architecture, frontend navigation, tracking logic, payroll engine, and RBAC implementation.
- **Knowledge Base Creation**: Created a structured [analysis_results.artifact.md](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/.artifacts/737a9217-3e1a-40bd-9737-33c7fde38b9d/analysis_results.artifact.md) documenting the system's core logic and recommendations.
- **Tracking Logic Review**: Analyzed the Capacitor-based background tracking and its alert mechanism for internet/location availability.
- **Payroll Logic Review**: Verified the salary calculation formulas, multi-calendar support (AD/BS), and audit history implementation.
