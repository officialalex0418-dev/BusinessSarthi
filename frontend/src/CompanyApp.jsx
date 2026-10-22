import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  LayoutDashboard, Building2, Users, Package, Wallet, Settings,
  MapPin, Boxes, Truck, TrendingUp, FileText, CalendarCheck, CalendarOff, User,
  MessageSquare, LifeBuoy
} from 'lucide-react';

// Company
import CompanyDashboard from '@/pages/company/Dashboard';
import StaffList from '@/pages/company/StaffList';
import LiveTracking from '@/pages/company/LiveTracking';
import InventoryPage from '@/pages/company/Inventory';
import Distributors from '@/pages/company/Distributors';
import DistributorDetails from '@/pages/company/DistributorDetails';
import CompanyCustomers from '@/pages/company/Customers';
import Vendors from '@/pages/company/Vendors';
import VendorDetails from '@/pages/company/VendorDetails';
import CompanyPayroll from '@/pages/company/Payroll';
import SalesTracker from '@/pages/company/SalesTracker';
import Reports from '@/pages/company/Reports';
import Leaves from '@/pages/company/Leaves';
import AttendancePage from '@/pages/company/Attendance';
import CompanySettings from '@/pages/company/Settings';
import CompanyEditProfile from '@/pages/company/EditProfile';
import CompanyConfiguration from '@/pages/company/Configuration';
import CompanyDesignations from '@/pages/company/Designations';
import CompanyBranches from '@/pages/company/Branches';
import CompanyShifts from '@/pages/company/Shifts';
import CompanyTargets from '@/pages/company/Targets';
import CompanyDepartments from '@/pages/company/Departments';
import CompanyLeavesConfig from '@/pages/company/LeavesConfig';
import HolidayCalendar from '@/pages/company/HolidayCalendar';
import Chat from '@/pages/shared/Complaints';

// Staff
import StaffDashboard from '@/pages/staff/Dashboard';
import StaffAttendance from '@/pages/staff/Attendance';
import StaffLeaves from '@/pages/staff/Leaves';
import StaffCustomers from '@/pages/staff/Customers';
import StaffSales from '@/pages/staff/Sales';
import StaffPayroll from '@/pages/staff/Payroll';
import StaffProfile from '@/pages/staff/Profile';
import EditProfile from '@/pages/staff/EditProfile';
import TicketList from '@/pages/support/TicketList';
import TicketDetail from '@/pages/support/TicketDetail';
import ChangePassword from '@/pages/auth/ChangePassword';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.needsPasswordChange) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/company" replace />;
  return children;
}

const companyNav = [
  { to: '/company', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/company/Staff', label: 'Employee', icon: Users },
  { to: '/company/tracking', label: 'Live Tracking', icon: MapPin },
  { to: '/company/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/company/leaves', label: 'Leave Management', icon: CalendarOff },
  { to: '/company/sales', label: 'Sales Tracker', icon: TrendingUp },
  { to: '/company/customers', label: 'Customer Master List', icon: Users },
  { to: '/company/inventory', label: 'Inventory', icon: Boxes },
  { to: '/company/distributors', label: 'Outlets', icon: Truck },
  { to: '/company/vendors', label: 'Vendors', icon: Building2 },
  { to: '/company/payroll', label: 'Payroll Management', icon: Wallet },
  { to: '/company/complaints', label: 'Chat', icon: MessageSquare },
  { to: '/company/support', label: 'Support', icon: LifeBuoy },
  { to: '/company/reports', label: 'Reports', icon: FileText },
  { to: '/company/configuration', label: 'Configuration', icon: Settings },
  { to: '/company/settings', label: 'Settings', icon: Settings },
];

const staffNavBase = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/staff/leaves', label: 'Leaves', icon: CalendarOff },
  { to: '/staff/customers', label: 'Customers', icon: Users },
  { to: '/staff/sales', label: 'Sales Entry', icon: TrendingUp },
  { to: '/staff/payroll', label: 'My Payroll', icon: Wallet },
  { to: '/staff/complaints', label: 'Chat', icon: MessageSquare },
  { to: '/staff/support', label: 'Support', icon: LifeBuoy },
  { to: '/staff/profile', label: 'Profile', icon: User },
];

export default function CompanyApp() {
  const { user } = useAuth();

  const hasFeature = (feature) => {
    if (['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(user?.role)) return true;
    const features = user?.company?.package?.features || {};
    if (feature === 'distributorManagement') {
      return features.distributorManagement !== false;
    }
    return !!features[feature];
  };

  const filteredCompanyNav = companyNav.filter(item => {
    if (item.to === '/company/complaints' && !hasFeature('complaintChat')) return false;
    if (item.to === '/company/sales' && !hasFeature('salesTracking')) return false;
    if (item.to === '/company/inventory' && !hasFeature('inventoryManagement')) return false;
    if (item.to === '/company/distributors' && !hasFeature('distributorManagement')) return false;
    if (item.to === '/company/vendors' && !hasFeature('vendorManagement')) return false;
    if (item.to === '/company/payroll' && !hasFeature('payrollManagement')) return false;

    if (user?.role === 'COMPANY_OWNER') return true;

    if (user?.designation?.permissions) {
      const perms = user.designation.permissions;
      if (item.to === '/company/Staff') return perms.staff;
      if (item.to === '/company/tracking') return perms.liveTracking;
      if (item.to === '/company/attendance') return perms.attendance;
      if (item.to === '/company/leaves') return perms.leaves;
      if (item.to === '/company/sales') return perms.salesTracker;
      if (item.to === '/company/customers') return perms.customerMasterList;
      if (item.to === '/company/inventory') return perms.inventory;
      if (item.to === '/company/distributors') return perms.distributors;
      if (item.to === '/company/vendors') return perms.vendors;
      if (item.to === '/company/payroll') return perms.payroll;
      if (item.to === '/company/complaints') return perms.complaints;
      if (item.to === '/company/reports') return perms.reports;
      if (item.to === '/company/configuration') return perms.configuration;
    }

    return user?.role === 'COMPANY_MANAGER';
  });

  const finalStaffNav = [...staffNavBase];

  if (user?.role === 'STAFF' || user?.role === 'COMPANY_MANAGER' || user?.role === 'COMPANY_OWNER') {
    const perms = user?.designation?.permissions;
    if (perms) {
      if (perms.staff) finalStaffNav.push({ to: '/staff/management/staff', label: 'Employee Mgmt', icon: Users });
      if (perms.liveTracking) finalStaffNav.push({ to: '/staff/management/tracking', label: 'Tracking Mgmt', icon: MapPin });
      if (perms.attendance) finalStaffNav.push({ to: '/staff/management/attendance', label: 'Attendance Mgmt', icon: CalendarCheck });
      if (perms.leaves) finalStaffNav.push({ to: '/staff/management/leaves', label: 'Leave Mgmt', icon: CalendarOff });
      if (perms.salesTracker && hasFeature('salesTracking')) {
         finalStaffNav.push({ to: '/staff/management/sales', label: 'Sales Mgmt', icon: TrendingUp });
      }
      if (perms.customerMasterList) {
         finalStaffNav.push({ to: '/staff/management/customers', label: 'Customer Master List', icon: Users });
      }
      if (perms.inventory && hasFeature('inventoryManagement')) finalStaffNav.push({ to: '/staff/management/inventory', label: 'Inventory', icon: Boxes });
      if (perms.distributors && hasFeature('distributorManagement')) {
         finalStaffNav.push({ to: '/staff/management/distributors', label: 'Outlets', icon: Truck });
      }
      if (perms.vendors && hasFeature('vendorManagement')) {
         finalStaffNav.push({ to: '/staff/management/vendors', label: 'Vendors', icon: Building2 });
      }
      if (perms.payroll && hasFeature('payrollManagement')) finalStaffNav.push({ to: '/staff/management/payroll', label: 'Payroll', icon: Wallet });
      if (perms.reports) finalStaffNav.push({ to: '/staff/management/reports', label: 'Reports', icon: FileText });
      if (perms.configuration) finalStaffNav.push({ to: '/staff/management/configuration', label: 'Config', icon: Settings });
    }
  }

  const finalFilteredStaffNav = finalStaffNav.filter(item => {
    if (item.to === '/staff/complaints' && !hasFeature('complaintChat')) return false;

    const dept = (user?.designation?.department?.name || '').toLowerCase();
    const isSalesDept = dept.includes('sales') || dept.includes('marketing');
    const perms = user?.designation?.permissions || {};

    if (item.to === '/staff/customers') {
      if (!hasFeature('salesTracking')) return false;
      return isSalesDept || perms.salesEntry || perms.customerMasterList;
    }

    if (item.to === '/staff/sales') {
      if (!hasFeature('salesTracking')) return false;
      return isSalesDept || perms.salesEntry || perms.salesTracker;
    }

    return true;
  });

  return (
    <Routes>
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/company"
        element={
          <Protected roles={['COMPANY_OWNER', 'COMPANY_MANAGER']}>
            <DashboardLayout title="Company Panel" nav={filteredCompanyNav} />
          </Protected>
        }
      >
        <Route index element={<CompanyDashboard />} />
        <Route path="Staff" element={<StaffList />} />
        <Route path="tracking" element={<LiveTracking />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="sales" element={<SalesTracker />} />
        <Route path="customers" element={<CompanyCustomers />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="distributors" element={<Distributors />} />
        <Route path="distributors/:id" element={<DistributorDetails />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendors/:id" element={<VendorDetails />} />
        <Route path="payroll" element={<CompanyPayroll />} />
        <Route path="complaints" element={hasFeature('complaintChat') ? <Chat /> : <Navigate to="/company" />} />
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

      <Route
        path="/staff"
        element={
          <Protected roles={['STAFF', 'COMPANY_MANAGER']}>
            <DashboardLayout title="Staff App" nav={finalFilteredStaffNav} />
          </Protected>
        }
      >
        <Route index element={<StaffDashboard />} />
        <Route path="attendance" element={<StaffAttendance />} />
        <Route path="leaves" element={<StaffLeaves />} />
        <Route path="customers" element={<StaffCustomers />} />
        <Route path="sales" element={<StaffSales />} />
        <Route path="payroll" element={<StaffPayroll />} />
        <Route path="complaints" element={hasFeature('complaintChat') ? <Chat /> : <Navigate to="/staff" />} />
        <Route path="support" element={<TicketList />} />
        <Route path="support/:id" element={<TicketDetail />} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="profile/edit" element={<EditProfile />} />

        <Route path="management/staff" element={<StaffList />} />
        <Route path="management/tracking" element={<LiveTracking />} />
        <Route path="management/attendance" element={<AttendancePage />} />
        <Route path="management/leaves" element={<Leaves />} />
        <Route path="management/sales" element={<SalesTracker />} />
        <Route path="management/customers" element={<CompanyCustomers />} />
        <Route path="management/inventory" element={<InventoryPage />} />
        <Route path="management/distributors" element={<Distributors />} />
        <Route path="management/distributors/:id" element={<DistributorDetails />} />
        <Route path="management/vendors" element={<Vendors />} />
        <Route path="management/vendors/:id" element={<VendorDetails />} />
        <Route path="management/payroll" element={<CompanyPayroll />} />
        <Route path="management/reports" element={<Reports />} />
        <Route path="management/configuration">
          <Route index element={<CompanyConfiguration />} />
          <Route path="designations" element={<CompanyDesignations />} />
          <Route path="branches" element={<CompanyBranches />} />
          <Route path="shifts" element={<CompanyShifts />} />
          <Route path="targets" element={<CompanyTargets />} />
          <Route path="departments" element={<CompanyDepartments />} />
          <Route path="leaves" element={<CompanyLeavesConfig />} />
          <Route path="holidays" element={<HolidayCalendar />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/company" replace />} />
    </Routes>
  );
}
