# Implementation Plan - Fix Company Logo Display (Cloudflare R2)

The company logo is not displaying because the current URL generation logic defaults to the internal S3 API endpoint of Cloudflare R2, which requires authentication. I will implement a backend proxy to serve these files securely and fix the URL generation.

## Proposed Changes

### 🔌 Backend (API)

#### [NEW] Implement File Proxy in `misc.controller.js`
Add a new controller function `getFile` that:
- Uses the existing S3 client to fetch the requested object from R2.
- Streams the file content directly to the response with the correct `Content-Type`.
- Acts as a secure gateway for files when a public R2 bucket is not configured.

#### [MODIFY] [routes/index.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/routes/index.js)
- Register the proxy route: `r.get('/files/:folder/:key', misc.getFile);`.
- Ensure this route is public (not requiring `protect` middleware) so images can be embedded in emails and the dashboard.

#### [MODIFY] [storage.service.js](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/backend/src/services/storage.service.js)
- Update `uploadFile` to return the new proxy URL (`/api/v1/files/...`) by default if `R2_PUBLIC_URL` is not provided.
- This ensures all *future* uploads work perfectly out of the box.

### 🌐 Frontend (Dashboard)

#### [MODIFY] [Dashboard.jsx](file:///C:/Users/laxmi/Downloads/workspace-019ebb3e-63d6-7b41-ac61-ef22f1a177b8/business-sarthi/frontend/src/pages/company/Dashboard.jsx)
- Add a fallback helper to handle existing "broken" URLs.
- If the logo URL points to `r2.cloudflarestorage.com`, redirect it to the backend proxy.

## Verification Plan

### Automated Tests
- Upload a test image through the Company Settings and verify the returned URL format.
- Manually hit the proxy URL in a browser to ensure it streams the image correctly.

### Manual Verification
- Check the Company Dashboard and Settings pages to ensure the logo is now visible.
- Verify the logo displays correctly on the mobile app (APK).
