import {
  Users, CalendarCheck, MapPin, TrendingUp,
  Boxes, FileSpreadsheet, Wallet, BarChart3,
  Bell, ShieldAlert, Globe2, Sparkles,
  ShoppingCart, Truck, Building2, UserCheck
} from 'lucide-react';

export const productFeatures = [
  {
    id: 'employee-management',
    title: 'Workforce Management',
    desc: 'Manage employees, roles, departments, and workforce profiles in one centralized directory.',
    icon: Users,
    available: true,
    category: 'People'
  },
  {
    id: 'attendance',
    title: 'Attendance Intelligence',
    desc: 'Track check-in/out, late detection, and working hours with GPS-verified accuracy.',
    icon: CalendarCheck,
    available: true,
    category: 'People'
  },
  {
    id: 'gps-tracking',
    title: 'Live GPS Tracking',
    desc: 'Real-time staff movement, route playback, and heatmaps for field operations.',
    icon: MapPin,
    available: true,
    category: 'People'
  },
  {
    id: 'sales-management',
    title: 'Sales Performance',
    desc: 'Monitor sales activity, set targets, and track real-time achievement percentages.',
    icon: TrendingUp,
    available: true,
    category: 'Sales'
  },
  {
    id: 'inventory-management',
    title: 'Inventory & Stock',
    desc: 'Track SKU levels, stock movements, and low-stock alerts across your business.',
    icon: Boxes,
    available: true,
    category: 'Operations'
  },
  {
    id: 'distributor-management',
    title: 'Distributor Network',
    desc: 'Manage distributor profiles, ledger transactions, and product movements.',
    icon: Truck,
    available: true,
    category: 'Operations'
  },
  {
    id: 'vendor-management',
    title: 'Vendor Relations',
    desc: 'Keep records of suppliers, purchase history, and outstanding balances.',
    icon: Building2,
    available: true,
    category: 'Operations'
  },
  {
    id: 'purchase-management',
    title: 'Purchase Tracking',
    desc: 'Digitalize purchase orders and stock acquisition from vendors.',
    icon: ShoppingCart,
    available: true,
    category: 'Operations'
  },
  {
    id: 'payroll-automation',
    title: 'Automated Payroll',
    desc: 'Auto-generate salary slips from attendance, including allowances and deductions.',
    icon: Wallet,
    available: true,
    category: 'People'
  },
  {
    id: 'leave-management',
    title: 'Leave Workflow',
    desc: 'Complete system for leave applications, multi-level approvals, and balances.',
    icon: FileSpreadsheet,
    available: true,
    category: 'People'
  },
  {
    id: 'deep-analytics',
    title: 'Business Analytics',
    desc: 'Turn raw data into actionable insights with visual dashboards and reports.',
    icon: BarChart3,
    available: true,
    category: 'Intelligence'
  },
  {
    id: 'security-compliance',
    title: 'Enterprise Security',
    desc: 'Tenant isolation, RBAC, and audit logs to ensure your business data is protected.',
    icon: ShieldAlert,
    available: true,
    category: 'Intelligence'
  }
];
