# 🌐 Business Sarthi Marketing Website

The official public-facing marketing website for Business Sarthi.

## 🚀 Tech Stack
- **React 18** (Vite)
- **Tailwind CSS**
- **Framer Motion** (Subtle animations)
- **Lucide React** (Icons)
- **React Router 6**

## 📂 Project Structure
```text
website/
├── public/          # Static assets (logo, robots, sitemap)
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page components
│   ├── layouts/     # Shared layouts
│   ├── config/      # Site configuration & URLs
│   ├── utils/       # Utility functions
│   └── App.jsx      # Main routing
```

## 🛠️ Getting Started

### Local Development
```bash
cd website
npm install
npm run dev
```

### Production Build
```bash
npm run build
```
The output will be in the `dist/` folder.

## 🌐 Environment Variables
Copy `.env.example` to `.env` and fill in the values:
- `VITE_APP_URL`: URL of the SaaS application (e.g., https://app.businesssarthi.com)
- `VITE_API_URL`: URL of the backend API
- `VITE_WEBSITE_URL`: Canonical URL of this website

## 📄 Pages
- **Home**: Main landing page with hero, features, and CTA.
- **Features**: Detailed overview of platform capabilities.
- **Pricing**: Subscription tiers and plans.
- **About**: Vision, mission, and company values.
- **Contact**: Inquiry form and contact details.
- **Legal**: Privacy Policy, Terms, Refund Policy, and Cookie Policy.

---
© 2026 Business Sarthi. All rights reserved.
