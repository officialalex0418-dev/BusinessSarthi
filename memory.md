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
- **Designation System**: Removed the confusing "Base System Role" field. Designations are now fully driven by granular **Access Permissions**.
- **RBAC Logic**: Updated middleware to grant access based on designation permissions even for users with the `STAFF` role.
- **Staff Profile**: Fixed staff profile photo upload functionality and added support for updating Name, Address, and PAN fields. Disabled the email field in profile edits to prevent login conflicts.

### 🚀 DevOps
- Cleaned up legacy deployment files (`render.yaml`, `vercel.json`).
- Updated project documentation (`README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`) to reflect the new stack.
- Successfully pushed all refactors and fixes to the GitHub `master` branch.
