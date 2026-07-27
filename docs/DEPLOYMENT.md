# Business Sarthi — Deployment Guide

## 0. Prerequisites
- **MongoDB Atlas** account (Database)
- **Northflank** account (Backend API)
- **Cloudflare** account (DNS + Pages for Frontend + R2 for Storage)
- **Resend** account (Email Service)
- **Google Cloud** project with **Maps JavaScript API** enabled

---

## 1. MongoDB Atlas
1. Create a project → build an **M10 (prod)** cluster.
2. **Database Access** → add user with `readWrite` on `business_sarthi`.
3. **Network Access** → allow Northflank outbound IPs (or 0.0.0.0/0 for testing).
4. Copy the connection string (MONGO_URI).

## 2. Backend → Northflank
1. Connect your GitHub repository to Northflank.
2. Create a **New Combined Service** or **Web Service**.
3. Select the `backend` directory / Dockerfile.
4. Settings:
   - Node.js 20 environment.
   - Port: 5000 (or as configured).
5. Environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=<atlas uri>
   CLIENT_URL=https://app.bussinesssarthi.com
   API_BASE_URL=https://api.bussinesssarthi.com
   JWT_ACCESS_SECRET=<64+ random chars>
   JWT_REFRESH_SECRET=<different 64+ chars>
   RESEND_API_KEY=<your resend api key>
   EMAIL_FROM="Business Sarthi <onboarding@resend.dev>"
   R2_ACCESS_KEY_ID=<cloudflare r2 key>
   R2_SECRET_ACCESS_KEY=<cloudflare r2 secret>
   R2_BUCKET=<bucket name>
   R2_ENDPOINT=https://<account id>.r2.cloudflarestorage.com
   R2_PUBLIC_URL=https://pub-<id>.r2.dev
   GOOGLE_MAPS_API_KEY=<key>
   ```

## 3. Frontend → Cloudflare Pages
1. Cloudflare Dashboard → **Workers & Pages**.
2. Create **New Application** → **Pages** → **Connect to Git**.
3. Build settings:
   - Framework preset: **Vite**.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `frontend`
4. Environment variables:
   ```
   VITE_API_URL=https://api.bussinesssarthi.com
   VITE_GOOGLE_MAPS_API_KEY=<key>
   ```

## 4. Cloudflare DNS & SSL
1. Set up your domain `businesssarthi.com` in Cloudflare.
2. Create CNAME records:
   - `app` → Points to Cloudflare Pages.
   - `api` → Points to Northflank service URL.
3. Enable **Full (Strict)** SSL/TLS mode.

## 5. Storage → Cloudflare R2
1. Create an R2 bucket.
2. Generate API credentials with Read/Write access.
3. Use the public URL or custom domain for serving files.

## 6. Post-deploy checklist
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] Seeded super admin login works.
- [ ] Forgot-password email arrives via Resend.
- [ ] Reports and photos upload/download from R2.
- [ ] Staff app (APK) connects to `api.bussinesssarthi.com`.

## 4. Google Maps keys
- **Browser key** (frontend): restrict by HTTP referrer (`https://your-app.vercel.app/*`),
  enable *Maps JavaScript API*. Used by `@react-google-maps/api` incl. heatmap (visualization library).
- **Server key** (optional, backend geocoding later): restrict by IP.

## 5. Gmail App Password (Nodemailer)
1. Enable 2-Step Verification on the Google account.
2. https://myaccount.google.com/apppasswords → create app password → put in `EMAIL_PASS`.
3. Gmail limit ≈ 500 mails/day — switch to SendGrid/SES/Postmark in production
   (only `SMTP_HOST/PORT/USER/PASS` change).

## 6. Docker (self-hosting alternative)
```bash
cd business-sarthi
cat > .env <<'EOF'
JWT_ACCESS_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
EMAIL_USER=
EMAIL_PASS=
VITE_GOOGLE_MAPS_API_KEY=
EOF
docker compose up -d --build
# web → http://localhost:8080 · api → http://localhost:5000 · mongo → 27017
docker compose exec api node src/seed/seed.js
```

## 7. Post-deploy checklist
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] Seeded super admin login works, then **change its password**
- [ ] Forgot-password email arrives
- [ ] Staff login → location ping appears on company Live Tracking map in real time
- [ ] Excel + PDF report downloads work
- [ ] Rotate any credential that was ever shared in plaintext
- [ ] Enable Atlas backups + alerts (connections, disk, slow queries)

## 8. Future Scalability Recommendations
1. **Location ingestion at scale** (10k staff × 48 pings/day ≈ 500k docs/day):
   - Move ingestion behind a queue (BullMQ + Redis); API enqueues, worker bulk-inserts.
   - Convert `locationlogs` to a **MongoDB time-series collection**.
   - Atlas Online Archive for pings older than 90–180 days (TTL already in place).
2. **Horizontal API scaling:** Render autoscaling + `socket.io` Redis adapter
   (`@socket.io/redis-adapter`) so rooms work across instances.
3. **Caching:** Redis for dashboard aggregates (30–60 s TTL) and package/feature lookups.
4. **Background jobs:** node-cron/BullMQ for scheduled payroll, daily absent-marking,
   package-expiry checks, email digests.
5. **Mobile:** wrap staff app in **Capacitor/React Native** for true background tracking
   (Android ForegroundService, iOS Always-location); reuse the same `/locations` batch API.
6. **Files:** move logos/photos to S3/Cloudinary signed uploads (URLs already supported).
7. **Observability:** pino structured logs, Sentry, OpenTelemetry traces, Atlas Performance Advisor.
8. **Security hardening:** 2FA for owners/admins, IP allowlists per company,
   secrets manager (Doppler/AWS SM), per-tenant rate limits, CSP headers on frontend.
9. **Billing:** integrate Stripe/Khalti/eSewa subscriptions driving `Company.packageExpiresAt`,
   with a cron downgrading expired companies.
10. **Data isolation upsell:** for enterprise customers, support dedicated databases
    per tenant behind the same API (connection registry keyed by company).
