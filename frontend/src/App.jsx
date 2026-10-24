import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import {
  LayoutDashboard, Building2, Users, Package, Wallet, Settings, ShieldCheck,
  MapPin, Boxes, Truck, TrendingUp, FileText, CalendarCheck, CalendarOff, User,
  MessageSquare, LayoutGrid, Inbox, LifeBuoy, Store, PackageCheck, Calculator
} from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { Spinner } from '@/components/ui';
import { ROLE_HOME, getRoleHome } from '@/lib/utils';
import DashboardLayout from '@/layouts/DashboardLayout';
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import { useState } from 'react';

// Auth
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Super Admin
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import AdminEmployeeDashboard from '@/pages/superadmin/AdminEmployeeDashboard';
import SuperDashboard from '@/pages/superadmin/Dashboard';
import Companies from '@/pages/superadmin/Companies';
import Stockists from '@/pages/superadmin/Stockists';
import Packages from '@/pages/superadmin/Packages';
import SystemEmployees from '@/pages/superadmin/SystemEmployees';
import CompanyStaff from '@/pages/superadmin/CompanyStaff';
import Products from '@/pages/superadmin/Products';
import Configuration from '@/pages/superadmin/Configuration';
import Designations from '@/pages/superadmin/Designations';
import Shifts from '@/pages/superadmin/Shifts';
import AuditLogs from '@/pages/superadmin/AuditLogs';
import AdminSettings from '@/pages/superadmin/AdminSettings';
import InquiryList from '@/pages/superadmin/inquiry/InquiryList';
import InquiryDetail from '@/pages/superadmin/inquiry/InquiryDetail';
import SupportManagement from '@/pages/superadmin/support/SupportManagement';
import AdminTicketDetail from '@/pages/superadmin/support/AdminTicketDetail';

// Company
import CompanyOwnerDashboard from '@/pages/company/CompanyOwnerDashboard';
import CompanyEmployeeDashboard from '@/pages/company/CompanyEmployeeDashboard';
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
import StockistDispatchPayment from '@/pages/stockist/StockistDispatchPayment';
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
import LinkStockist from '@/pages/company/LinkStockist';
import LinkVendor from '@/pages/company/LinkVendor';
import Chat from '@/pages/shared/Complaints';

// Staff
import StaffDashboard from '@/pages/staff/Dashboard';

// Stockist
import StockistOwnerDashboard from '@/pages/stockist/StockistOwnerDashboard';
import StockistEmployeeDashboard from '@/pages/stockist/StockistEmployeeDashboard';
import StockistDashboard from '@/pages/stockist/StockistDashboard';
import StockistAccountManager from '@/pages/stockist/StockistAccountManager';
import SalesStatistics from '@/pages/stockist/SalesStatistics';
import StaffAttendance from '@/pages/staff/Attendance';
import StaffLeaves from '@/pages/staff/Leaves';
import StaffCustomers from '@/pages/staff/Customers';
import StaffSales from '@/pages/staff/Sales';
import StaffPayroll from '@/pages/staff/Payroll';
import StaffProfile from '@/pages/staff/Profile';
import EditProfile from '@/pages/staff/EditProfile';
import ChangePassword from '@/pages/auth/ChangePassword';
import TicketList from '@/pages/support/TicketList';
import TicketDetail from '@/pages/support/TicketDetail';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.needsPasswordChange) return <Navigate to="/change-password" replace />;

  if (roles && !roles.includes(user.role)) {
    if (roles.includes('STOCKIST') && user.stockist && ['STOCKIST', 'COMPANY_MANAGER', 'STAFF'].includes(user.role)) {
      return children;
    }
    return <Navigate to={getRoleHome(user)} replace />;
  }

  return children;
}

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/stockists', label: 'Stockists', icon: Store },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/employees', label: 'System Employees', icon: Users },
  { to: '/admin/company-staff', label: 'Company Staff', icon: Users },
  { to: '/admin/products', label: 'RCS Products', icon: LayoutGrid },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy },
  { to: '/admin/configuration', label: 'Configuration', icon: Settings },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const companyNav = [
  { to: '/company', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/company/Staff', label: 'Employee', icon: Users },
  { to: '/company/tracking', label: 'Live Tracking', icon: MapPin },
  { to: '/company/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/company/leaves', label: 'Leave Management', icon: CalendarOff },
  { to: '/company/sales', label: 'Sales Tracker', icon: TrendingUp },
  { to: '/company/customers', label: 'Customer Master List', icon: Users },
  { to: '/company/inventory', label: 'Inventory', icon: Boxes },
  { to: '/company/distributors', label: 'Distributors', icon: Truck },
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

const stockistNav = [
  { to: '/stockist/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stockist/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/stockist/leaves', label: 'Leave Management', icon: CalendarOff },
  { to: '/stockist/payroll', label: 'My Payroll', icon: Wallet },
  { to: '/stockist/accounts', label: 'Account Manager', icon: Calculator },
  { to: '/stockist/staff', label: 'Employee', icon: Users },
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

export default function App() {
  const { user, loading } = useAuth();
  const { requestAllPermissions } = useAppPermissions();
  const [splashFinished, setSplashFinished] = useState(false);

  const hasFeature = (feature) => {
    if (['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(user?.role)) return true;
    const features = user?.company?.package?.features || {};
    if (feature === 'distributorManagement') {
      return features.distributorManagement !== false;
    }
    return !!features[feature];
  };

  const filteredAdminNav = adminNav.filter(item => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (user?.role === 'ADMIN_EMPLOYEE') {
      const perms = user.designation?.permissions || {};
      if (item.to === '/admin/companies') return perms.companies;
      if (item.to === '/admin/stockists') return perms.companies;
      if (item.to === '/admin/packages') return perms.packages;
      if (item.to === '/admin/employees') return perms.systemEmployees;
      if (item.to === '/admin/company-staff') return perms.companyStaff;
      if (item.to === '/admin/configuration') return perms.configuration;
    }
    return true;
  });

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

  const filteredStockistNav = stockistNav.map(item => {
    if (item.to === '/stockist/attendance') {
      const hasPerm = user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER' || user?.designation?.permissions?.attendance;
      return { ...item, label: hasPerm ? 'Attendance Management' : 'Attendance' };
    }
    if (item.to === '/stockist/leaves') {
      const hasPerm = user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER' || user?.designation?.permissions?.leaves;
      return { ...item, label: hasPerm ? 'Leave Management' : 'Leave' };
    }
    return item;
  }).filter(item => {
    if (user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER') return true;

    // Base items always shown for staff
    if (['/stockist/dashboard', '/stockist/attendance', '/stockist/leaves', '/stockist/payroll', '/stockist/support', '/stockist/settings'].includes(item.to)) {
      return true;
    }

    const perms = user?.designation?.permissions;
    if (!perms) return false;

    if (item.to === '/stockist/accounts') return !!perms.accounts;
    if (item.to === '/stockist/staff') return !!perms.staff;
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
         finalStaffNav.push({ to: '/staff/management/distributors', label: 'Distributors', icon: Truck });
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

  useEffect(() => {
    requestAllPermissions().catch(() => {});

    // Native Push Notifications Initialization
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          if (!PushNotifications || typeof PushNotifications.requestPermissions !== 'function') {
            return;
          }

          // Create high-importance channels for Android heads-up notifications
          try {
            await Promise.all([
              PushNotifications.createChannel({
                id: 'bs_alerts',
                name: 'Business Sarthi Alerts',
                description: 'Critical business notifications & chat messages',
                importance: 5, // High Importance (shows banner & plays sound)
                visibility: 1, // Public
                sound: 'default',
                vibration: true,
              }),
              PushNotifications.createChannel({
                id: 'default',
                name: 'Default Notifications',
                description: 'General system notifications',
                importance: 5,
                visibility: 1,
                sound: 'default',
                vibration: true,
              })
            ]);
          } catch (chErr) {
            console.warn('FCM Channel Creation Warning:', chErr);
          }

          // Remove any existing listeners before re-adding
          await PushNotifications.removeAllListeners();

          // Set up listeners first before calling register()
          await PushNotifications.addListener('registration', token => {
            console.log('FCM Registration Token received:', token.value);
            localStorage.setItem('fcm_token', token.value);
            api.patch('/auth/fcm-token', { token: token.value }).catch(err => {
              console.warn('Token save deferred until login:', err?.response?.data?.message || err.message);
            });
          });

          await PushNotifications.addListener('registrationError', err => {
            console.error('FCM Registration Error:', err);
          });

          await PushNotifications.addListener('pushNotificationReceived', async notification => {
            console.log('Push notification received in foreground:', notification);
            try {
              const notifTitle = notification.title || notification.data?.title || 'Business Sarthi';
              const notifBody = notification.body || notification.data?.message || notification.data?.body || 'New notification';
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: notifTitle,
                    body: notifBody,
                    id: Math.floor(Math.random() * 100000) + 1,
                    schedule: { at: new Date(Date.now() + 200) },
                    sound: 'default',
                    channelId: 'bs_alerts',
                    actionTypeId: '',
                    extra: notification.data || {}
                  }
                ]
              });
            } catch (fErr) {
              console.warn('Foreground local notification error:', fErr);
            }
          });

          await PushNotifications.addListener('pushNotificationActionPerformed', action => {
            console.log('Push notification action tapped:', action);
          });

          // Request permissions and register device with FCM
          const result = await PushNotifications.requestPermissions();
          const isGranted = result.receive === 'granted' || result.display === 'granted' || Capacitor.getPlatform() === 'android';
          if (isGranted) {
            try {
              await PushNotifications.register();
              console.log('Push Notifications registered successfully.');
            } catch (regErr) {
              console.warn(
                'Push Notifications registration failed. Please ensure google-services.json is placed in android/app/:',
                regErr
              );
            }
          } else {
            console.warn('Push Notification permissions not granted:', result);
          }
        } catch (e) {
          console.error('Push Notifications init error:', e);
        }
      })();
    }
  }, [requestAllPermissions]);

  // Handle Parallel Initialization and Splash Animation
  if (!splashFinished) {
    return (
      <SplashScreen
        isAppReady={!loading}
        onFinished={() => setSplashFinished(true)}
      />
    );
  }

  // If splash is done but app is still loading (rare safety case)
  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getRoleHome(user)} /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" />} />

      <Route
        path="/admin"
        element={
          <Protected roles={['SUPER_ADMIN', 'ADMIN_EMPLOYEE']}>
            <DashboardLayout title="Super Admin" nav={filteredAdminNav} />
          </Protected>
        }
      >
        <Route index element={user?.role === 'ADMIN_EMPLOYEE' ? <AdminEmployeeDashboard /> : <SuperAdminDashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="stockists" element={<Stockists />} />
        <Route path="packages" element={<Packages />} />
        <Route path="employees" element={<SystemEmployees />} />
        <Route path="company-staff" element={<CompanyStaff />} />
        <Route path="products" element={<Products />} />
        <Route path="configuration">
          <Route index element={<Configuration />} />
          <Route path="designations" element={<Designations />} />
          <Route path="shifts" element={<Shifts />} />
        </Route>
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="inquiries" element={<InquiryList />} />
        <Route path="inquiries/:id" element={<InquiryDetail />} />
        <Route path="support" element={<SupportManagement />} />
        <Route path="support/:id" element={<AdminTicketDetail />} />
      </Route>

      <Route
        path="/company"
        element={
          <Protected roles={['COMPANY_OWNER']}>
            <DashboardLayout title="Company Panel" nav={filteredCompanyNav} />
          </Protected>
        }
      >
        <Route index element={<CompanyOwnerDashboard />} />
        <Route path="Staff" element={<StaffList />} />
        <Route path="tracking" element={<LiveTracking />} />
        <Route path="attendance" element={
          user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER' || user?.designation?.permissions?.attendance
            ? <AttendancePage />
            : <StaffAttendance />
        } />
        <Route path="leaves" element={
          user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER' || user?.designation?.permissions?.leaves
            ? <Leaves />
            : <StaffLeaves />
        } />
        <Route path="sales" element={<SalesTracker />} />
        <Route path="sales-statistics" element={<SalesStatistics />} />
        <Route path="dispatch-payment" element={<StockistDispatchPayment />} />
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
          <Route path="link-stockist" element={<LinkStockist />} />
          <Route path="link-vendor" element={<LinkVendor />} />
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
        <Route index element={<CompanyEmployeeDashboard />} />
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
          <Route path="link-stockist" element={<LinkStockist />} />
          <Route path="link-vendor" element={<LinkVendor />} />
        </Route>
      </Route>

      <Route
        path="/stockist"
        element={
          <Protected roles={['STOCKIST', 'COMPANY_MANAGER', 'STAFF']}>
            <DashboardLayout title="Stockist Panel" nav={filteredStockistNav} />
          </Protected>
        }
      >
        <Route index element={user?.role === 'STAFF' ? <Navigate to="dashboard" replace /> : <StockistOwnerDashboard />} />
        <Route path="dashboard" element={user?.role === 'STAFF' ? <StockistEmployeeDashboard /> : <StockistOwnerDashboard />} />
        <Route path="accounts" element={<StockistAccountManager />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="attendance" element={
          user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER' || user?.designation?.permissions?.attendance
            ? <AttendancePage />
            : <StaffAttendance />
        } />
        <Route path="leaves" element={
          user?.role === 'STOCKIST' || user?.role === 'COMPANY_MANAGER' || user?.designation?.permissions?.leaves
            ? <Leaves />
            : <StaffLeaves />
        } />
        <Route path="sales" element={<SalesTracker />} />
        <Route path="sales-statistics" element={<SalesStatistics />} />
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
          <Route path="link-stockist" element={<LinkStockist />} />
          <Route path="link-vendor" element={<LinkVendor />} />
        </Route>
        <Route path="settings" element={<CompanySettings />} />
        <Route path="settings/edit" element={<CompanyEditProfile />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? getRoleHome(user) : '/login'} replace />} />
    </Routes>
  );
}
