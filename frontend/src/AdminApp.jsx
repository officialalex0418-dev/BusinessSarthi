import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  LayoutDashboard, Building2, Users, Package, Settings, ShieldCheck,
  Store, LayoutGrid, Inbox, LifeBuoy
} from 'lucide-react';

// Super Admin pages
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import AdminEmployeeDashboard from '@/pages/superadmin/AdminEmployeeDashboard';
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
import ChangePassword from '@/pages/auth/ChangePassword';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.needsPasswordChange) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/admin" replace />;
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

export default function AdminApp() {
  const { user } = useAuth();

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

  return (
    <Routes>
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/admin"
        element={
          <Protected roles={['SUPER_ADMIN', 'ADMIN_EMPLOYEE']}>
            <DashboardLayout title="Admin Panel" nav={filteredAdminNav} />
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
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
