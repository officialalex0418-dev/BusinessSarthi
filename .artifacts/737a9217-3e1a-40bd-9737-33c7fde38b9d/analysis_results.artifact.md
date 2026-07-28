# Business Sarthi - Codebase Analysis

Comprehensive technical analysis of the **Business Sarthi** SaaS platform, covering architecture, security, core modules, and implementation patterns.

## 🏗 System Architecture

The project is a full-stack multi-tenant SaaS application.

### Backend (Node.js / Express)
- **Multi-tenancy**: Shared-schema, row-level isolation using `company` ObjectId. Scoping is enforced via `scopeCompany` middleware.
- **RBAC**: Multi-layered permission system combining Roles (Super Admin to Staff) and granular Designation permissions.
- **Real-time**: Socket.io integration with room-based topology (platform, company, user) for live tracking and notifications.
- **Database**: MongoDB with Mongoose. Uses 2dsphere indexes for location logging and TTL indexes for automatic cleanup of tracking data.

### Frontend (React / Vite)
- **Capacitor Integration**: Cross-platform mobile support. Handles native features like background geolocation, local notifications, and file system access for reports.
- **Dynamic UI**: Navigation and action menus are dynamically generated based on a combination of User Role, Designation Permissions, and Company Package features.
- **Auth Flow**: JWT-based with access token rotation and theft detection. Axios interceptors handle automatic token refresh.

---

## 🔐 Core Security & Middleware

- **Authentication**: JWT with rotating refresh tokens stored hashed in DB for reuse detection.
- **Tenant Isolation**: Middleware `scopeCompany` ensures users can only access data belonging to their company.
- **Validation**: Strict schema validation using **Joi** at the route level.
- **Audit Logs**: Every sensitive action (login, payroll generation, settings changes) is recorded in a dedicated `AuditLog` collection.

---

## 📦 Key Modules Analysis

### 📍 Location Tracking
- **Server-driven Config**: Tracking interval (30/60/120 min) is controlled by the company's subscription package.
- **Reliability Features**: The staff app includes an audible alert mechanism and local notifications to ensure tracking is active during shifts.
- **Offline Support**: Uses a local queue to batch pings when internet is unavailable.

### 💰 Payroll Engine
- **Calendar Support**: Native support for both AD and Bikram Sambat (BS) calendars.
- **Logic**:
    - **Absent Deduction**: `((Basic Salary * 12) / 365) * Absent Days`.
    - **Tax**: `1%` of `(Basic Salary - Absent Deduction)`.
    - **Allowances**: Calculated per-day based on attendance (`PRESENT` or `HALF_DAY`).
- **Auditability**: Tracks a full `editHistory` for any manual salary adjustments.

### 📅 Attendance & Leave
- **Shift Aware**: Attendance status (Present/Half-Day) is calculated against assigned shifts.
- **Half-Day Rule**: Flexible 40% rule (worked hours < 40% of shift = Half-Day).
- **Workflow**: Staff submit requests/leaves, which are reviewed by managers through the dashboard.

---

## 🛠 Tech Stack Summary

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Shadcn/UI, Lucide React, Recharts |
| **Mobile** | Capacitor (Geolocation, Filesystem, Notifications, Network) |
| **Backend** | Node.js 20, Express, Socket.io, Mongoose |
| **Database** | MongoDB Atlas |
| **Services** | Resend (Email), Cloudflare R2 (Storage), Northflank (Hosting) |

---

## 💡 Recommendations for Development

1. **Null Safety**: Always use optional chaining when accessing `user.designation` or `user.company.package`, as these can be null for platform roles.
2. **Feature Gates**: When adding UI elements, always wrap them in `hasFeature()` checks to respect subscription tiers.
3. **Date Handling**: Use the provided `bsToAd` and `monthStr` utilities to maintain consistency across the AD/BS toggle.
