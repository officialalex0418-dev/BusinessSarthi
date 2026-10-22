import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  LayoutDashboard, Building2, Users, Wallet, Settings,
  Boxes, Truck, TrendingUp, FileText, CalendarCheck, CalendarOff,
  PackageCheck, Calculator, LifeBuoy
} from 'lucide-react';

// Stockist & Staff
import StockistOwnerDashboard from '@/pages/stockist/StockistOwnerDashboard';
import StockistEmployeeDashboard from '@/pages/stockist/StockistEmployeeDashboard';
import StockistDashboard from '@/pages/stockist/StockistDashboard';
import StockistAccountManager from '@/pages/stockist/StockistAccountManager';
import StaffList from '@/pages/company/StaffList';
import AttendancePage from '@/pages/company/Attendance';
import Leaves from '@/pages/company/Leaves';
import SalesTracker from '@/pages/company/SalesTracker';
import StockistDispatchPayment from '@/pages/stockist/StockistDispatchPayment';
import InventoryPage from '@/pages/company/Inventory';
import Distributors from '@/pages/company/Distributors';
import DistributorDetails from '@/pages/company/DistributorDetails';
import Vendors from '@/pages/company/Vendors';
import VendorDetails from '@/pages/company/VendorDetails';
import CompanyPayroll from '@/pages/company/Payroll';
import TicketList from '@/pages/support/TicketList';
import TicketDetail from '@/pages/support/TicketDetail';
import Reports from '@/pages/company/Reports';
import CompanyConfiguration from '@/pages/company/Configuration';
import CompanyDesignations from '@/pages/company/Designations';
import CompanyBranches from '@/pages/company/Branches';
import CompanyShifts from '@/pages/company/Shifts';
import CompanyTargets from '@/pages/company/Targets';
import CompanyDepartments from '@/pages/company/Departments';
import CompanyLeavesConfig from '@/pages/company/LeavesConfig';
import HolidayCalendar from '@/pages/company/HolidayCalendar';
import CompanySettings from '@/pages/company/Settings';
import CompanyEditProfile from '@/pages/company/EditProfile';
import StaffDashboard from '@/pages/staff/Dashboard';
import ChangePassword from '@/pages/auth/ChangePassword';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.needsPasswordChange) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) {
    if (roles.includes('STOCKIST') && user.stockist && ['STOCKIST', 'COMPANY_MANAGER', 'STAFF'].includes(user.role)) {
      return children;
    }
    return <Navigate to="/stockist" replace />;
  }
  return children;
}

const stockistNav = [
  { to: '/stockist', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stockist/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/stockist/leaves', label: 'Leave Management', icon: CalendarOff },
  { to: '/stockist/payroll', label: 'My Payroll', icon: Wallet },
  { to: '/stockist/accounts', label: 'Account Manager', icon: Calculator },
  { to: '/stockist/Staff', label: 'Employee', icon: Users },
  { to: '/stockist/sales', label: 'Sales Tracker', icon: TrendingUp },
  { to: '/stockist/dispatch-payment', label: 'Dispatch and Payment', icon: PackageCheck },
  { to: '/stockist/inventory', label: 'Inventory', icon: Boxes },
  { to: '/stockist/outlets', label: 'Outlets', icon: Truck },
  { to: '/stockist/vendors', label: 'Vendors', icon: Building2 },
  { to: '/stockist/reports', label: 'Report', icon: FileText },
  { to: '/stockist/configuration', label: 'Configuration', icon: Settings },
  { to: '/stockist/support', label: 'Support', icon: LifeBuoy },
  { to: '/stockist/settings', label: 'Profile', icon: Settings },
];

export default function StockistApp() {
  const { user } = useAuth();

  const hasFeature = (feature) => {
    if (['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(user?.role)) return true;
    const features = user?.company?.package?.features || {};
    if (feature === 'distributorManagement') {
      return features.distributorManagement !== false;
    }
    return !!features[feature];
  };

  const filteredStockistNav = stockistNav.map(item => {
    if (item.end && user?.role === 'STAFF') {
      return { ...item, to: '/stockist/Staff' };
    }
    return item;
  }).filter(item => {
    if (user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER') return true;

    // Base items always shown for staff
    if (['/stockist', '/stockist/Staff', '/stockist/attendance', '/stockist/leaves', '/stockist/payroll', '/stockist/support', '/stockist/settings'].includes(item.to)) {
      return true;
    }

    const perms = user?.designation?.permissions;
    if (!perms) return false;

    if (item.to === '/stockist/accounts') return !!perms.accounts;
    if (item.to === '/stockist/Staff') return !!perms.staff;
    if (item.to === '/stockist/sales') return !!perms.salesTracker;
    if (item.to === '/stockist/dispatch-payment') return !!perms.dispatchPayment;
    if (item.to === '/stockist/inventory') return !!perms.inventory;
    if (item.to === '/stockist/outlets') return !!perms.distributors;
    if (item.to === '/stockist/vendors') return !!perms.vendors;
    if (item.to === '/stockist/payroll') return !!perms.payroll;
    if (item.to === '/stockist/reports') return !!perms.reports;
    if (item.to === '/stockist/configuration') return !!perms.configuration;

    return true;
  });

  return (
    <Routes>
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/stockist"
        element={
          <Protected roles={['STOCKIST', 'COMPANY_MANAGER', 'STAFF']}>
            <DashboardLayout title="Stockist Panel" nav={filteredStockistNav} />
          </Protected>
        }
      >
        <Route index element={user?.role === 'STAFF' ? <Navigate to="Staff" replace /> : <StockistOwnerDashboard />} />
        <Route path="accounts" element={<StockistAccountManager />} />
        <Route path="Staff" element={user?.role === 'STAFF' ? <StockistEmployeeDashboard /> : <StaffList />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="sales" element={<SalesTracker />} />
        <Route path="dispatch-payment" element={<StockistDispatchPayment />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="outlets" element={<Distributors />} />
        <Route path="outlets/:id" element={<DistributorDetails />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendors/:id" element={<VendorDetails />} />
        <Route path="payroll" element={<CompanyPayroll />} />
        <Route path="support" element={<TicketList />} />
        <Route path="support/:id" element={<TicketDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="configuration">
          <Route index element={<CompanyConfiguration />} />
          <Route path="designations" element={<CompanyDesignations />} />
          <Route path="branches" element={<CompanyBranches />} />
          <Route path="shifts" element={<CompanyShifts />} />
          <Route path="targets" element={<CompanyTargets />} />
          <Route path="departments" element={<CompanyDepartments />} />
          <Route path="leaves" element={<CompanyLeavesConfig />} />
          <Route path="holidays" element={<HolidayCalendar />} />
        </Route>
        <Route path="settings" element={<CompanySettings />} />
        <Route path="settings/edit" element={<CompanyEditProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/stockist" replace />} />
    </Routes>
  );
}
