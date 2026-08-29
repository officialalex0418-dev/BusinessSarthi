import {
  Users, CalendarCheck, MapPin, TrendingUp,
  Boxes, FileSpreadsheet, Wallet, BarChart3,
  ShieldAlert, Globe2, ShoppingCart, Truck,
  Building2, MessageSquare, Inbox, Target,
  FileText, ShieldCheck, Zap
} from 'lucide-react';

export const productFeatures = [
  // People & Workforce
  {
    id: 'employee-management',
    title: 'Workforce Management',
    desc: 'Centralized directory for employee profiles, roles, departments, and hierarchical structures.',
    icon: Users,
    category: 'People',
    status: 'AVAILABLE'
  },
  {
    id: 'attendance',
    title: 'Attendance Intelligence',
    desc: 'GPS-verified check-ins with late detection, working hours calculation, and automated requests.',
    icon: CalendarCheck,
    category: 'People',
    status: 'AVAILABLE'
  },
  {
    id: 'gps-tracking',
    title: 'Live Field Tracking',
    desc: 'Real-time movement monitoring, route history playback, and movement heatmaps for field teams.',
    icon: MapPin,
    category: 'People',
    status: 'AVAILABLE'
  },
  {
    id: 'payroll-automation',
    title: 'Automated Payroll',
    desc: 'Generate salary slips from attendance data, including basic salary, allowances, and deductions.',
    icon: Wallet,
    category: 'People',
    status: 'AVAILABLE'
  },
  {
    id: 'leave-management',
    title: 'Leave Workflow',
    desc: 'Digital leave applications with multi-level approval cycles and real-time balance tracking.',
    icon: FileSpreadsheet,
    category: 'People',
    status: 'AVAILABLE'
  },

  // Sales & Revenue
  {
    id: 'sales-tracking',
    title: 'Sales Performance',
    desc: 'Real-time sales entry, invoice generation, and individual performance monitoring.',
    icon: TrendingUp,
    category: 'Sales',
    status: 'AVAILABLE'
  },
  {
    id: 'target-management',
    title: 'Sales Targets',
    desc: 'Set monthly targets for staff and track achievement percentages with visual progress bars.',
    icon: Target,
    category: 'Sales',
    status: 'AVAILABLE'
  },
  {
    id: 'customer-management',
    title: 'Customer Master',
    desc: 'Maintain detailed records of your entire customer base with transaction history.',
    icon: Users,
    category: 'Sales',
    status: 'AVAILABLE'
  },

  // Operations & Supply Chain
  {
    id: 'inventory-management',
    title: 'Inventory & Stock',
    desc: 'Track SKU levels, stock movements, and receive low-stock alerts across multiple warehouses.',
    icon: Boxes,
    category: 'Operations',
    status: 'AVAILABLE'
  },
  {
    id: 'vendor-management',
    title: 'Vendor Relations',
    desc: 'Manage supplier profiles, purchase history, outstanding payments, and ledger records.',
    icon: Building2,
    category: 'Operations',
    status: 'AVAILABLE'
  },
  {
    id: 'distributor-network',
    title: 'Distributor Management',
    desc: 'Control your distribution network with dedicated profiles, transactions, and performance data.',
    icon: Truck,
    category: 'Operations',
    status: 'AVAILABLE'
  },
  {
    id: 'purchase-management',
    title: 'Purchase Tracking',
    desc: 'Digitalize the procurement flow from purchase orders to inventory stocking.',
    icon: ShoppingCart,
    category: 'Operations',
    status: 'AVAILABLE'
  },

  // Intelligence & Support
  {
    id: 'deep-analytics',
    title: 'Business Analytics',
    desc: 'Visual dashboards for revenue, sales trends, inventory turnover, and workforce efficiency.',
    icon: BarChart3,
    category: 'Intelligence',
    status: 'AVAILABLE'
  },
  {
    id: 'automated-reports',
    title: 'Professional Reporting',
    desc: 'Generate Excel and PDF reports for tracking, attendance, sales, and financial summaries.',
    icon: FileText,
    category: 'Intelligence',
    status: 'AVAILABLE'
  },
  {
    id: 'enterprise-security',
    title: 'Secure Architecture',
    desc: 'JWT-based authentication, RBAC, tenant isolation, and comprehensive audit logging.',
    icon: ShieldCheck,
    category: 'Intelligence',
    status: 'AVAILABLE'
  },
  {
    id: 'support-center',
    title: 'Ticketing & Support',
    desc: 'Internal support system for troubleshooting and inquiry management for new leads.',
    icon: Inbox,
    category: 'Intelligence',
    status: 'AVAILABLE'
  }
];

export const featureCategories = [
  { id: 'All', label: 'All Features' },
  { id: 'People', label: 'Workforce' },
  { id: 'Sales', label: 'Sales & CRM' },
  { id: 'Operations', label: 'Supply Chain' },
  { id: 'Intelligence', label: 'Analytics' }
];
