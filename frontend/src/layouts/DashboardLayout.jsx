import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Menu, X, Moon, Sun, Bell, LogOut, ChevronDown, MapPin, LifeBuoy
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSocket, useSocketEvent } from '@/context/SocketContext';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { api } from '@/api/client';
import { cn, ROLE_LABELS, fixFileUrl } from '@/lib/utils';
import { t } from '@/lib/i18n';

export default function DashboardLayout({ title, nav }) {
  const { user, logout } = useAuth();
  const { dark, toggle, branding } = useTheme();
  const language = user?.company?.settings?.language || 'English';
  const { connected } = useSocket() || {};
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Background location tracking for staff - only when checked-in
  const isTrackingEnabled = user?.role === 'STAFF' && user?.isCheckedIn;
  const { isAlerting, ping } = useLocationTracker(isTrackingEnabled);

  // Listen for force refresh command from manager
  useSocketEvent('location:force_update', useCallback(() => {
    if (isTrackingEnabled && ping) {
       console.log('⚡ Force location update requested by manager');
       ping();
    }
  }, [isTrackingEnabled, ping]));

  useEffect(() => {
    // Dispatch a resize event when sidebar toggles to help components like Leaflet recalculate
    window.dispatchEvent(new Event('resize'));
  }, [sidebarOpen]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.data.items);
      setUnread(data.data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    // Setup Android Notification Channel for high priority (WhatsApp-like)
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().then(() => {
        LocalNotifications.createChannel({
          id: 'bs_alerts',
          name: 'Business Sarthi Alerts',
          description: 'Critical business notifications',
          importance: 5, // High
          visibility: 1, // Public (shows on lock screen)
          vibration: true,
        }).catch(err => console.error('Channel creation error:', err));
      }).catch(() => {});

      // Handle notification tap action from system status bar
      const listener = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const targetLink = action.notification.extra?.link;
        if (targetLink) {
          navigate(targetLink);
        } else {
          navigate(user?.role === 'COMPANY_OWNER' ? '/company/complaints' : '/staff/complaints');
        }
      });

      return () => {
        listener.then(l => l.remove()).catch(() => {});
      };
    }
  }, [navigate, user?.role]);

  useSocketEvent('notification:new', useCallback((n) => {
    setNotifications((prev) => [n, ...prev].slice(0, 10));
    setUnread((u) => u + 1);

    if (Capacitor.isNativePlatform()) {
      // 1. Permanent Shift Notification Control
      if (n.type === 'SHIFT_ACTIVE') {
        LocalNotifications.schedule({
          notifications: [{
            id: 999,
            title: 'Your Shift is Active',
            body: n.message || 'Your shift is active and location is being tracked.',
            ongoing: true,
            sticky: true,
            channelId: 'bs_alerts',
          }]
        }).catch(err => console.error('Local notification error:', err));
      } else if (n.type === 'SHIFT_INACTIVE' || n.clearSticky) {
        LocalNotifications.cancel({ notifications: [{ id: 999 }] }).catch(() => {});
      } else {
        // 2. Chat / Complaint / System Notifications on Notification Bar (with sender name & message)
        const targetLink = n.link || (user?.role === 'COMPANY_OWNER' ? '/company/complaints' : '/staff/complaints');
        LocalNotifications.schedule({
          notifications: [{
            title: n.title || 'Business Sarthi',
            body: n.message || '',
            id: Math.floor(Math.random() * 100000) + 1000,
            schedule: { at: new Date(Date.now() + 100) },
            attachments: [],
            actionTypeId: '',
            extra: { link: targetLink },
            channelId: 'bs_alerts',
          }]
        }).catch(err => console.error('Local notification error:', err));
      }
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      // Browser notification fallback
      try {
        new Notification(n.title || 'Business Sarthi', {
          body: n.message || '',
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }
  }, [user?.role]));

  const markRead = async () => {
    setNotifOpen((o) => !o);
    if (unread > 0) {
      try { await api.patch('/notifications/read', {}); setUnread(0); } catch {}
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleNotificationClick = (n) => {
    setNotifOpen(false);
    const role = user?.role;
    const isOwner = role === 'COMPANY_OWNER';
    const isManager = role === 'COMPANY_MANAGER';
    const isStaff = role === 'STAFF';
    const isStockistUser = role === 'STOCKIST' || !!user?.stockist;

    // Base paths based on role
    const mgmtPrefix = isStockistUser ? '/stockist' : (isOwner ? '/company' : (isManager ? '/staff/management' : ''));
    const staffPrefix = isStockistUser ? '/stockist' : '/staff';

    if (n.type === 'CHAT_MESSAGE' || n.type === 'COMPLAINT_NEW' || n.type === 'COMPLAINT_REPLY') {
      navigate(isOwner ? '/company/complaints' : '/staff/complaints');
      return;
    }

    if (n.link) {
      navigate(n.link);
      return;
    }

    switch (n.type) {
      case 'LEAVE_APPLIED':
        navigate(`${mgmtPrefix}/leaves`);
        break;
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
        navigate(`${staffPrefix}/leaves`);
        break;
      case 'PAYROLL_GENERATED':
        navigate(isStaff ? `${staffPrefix}/payroll` : `${mgmtPrefix}/payroll`);
        break;
      case 'LOW_STOCK':
        navigate(`${mgmtPrefix}/inventory`);
        break;
      case 'SALE_SUBMITTED':
        navigate(`${mgmtPrefix}/sales`);
        break;
      case 'STAFF_CREATED':
        navigate(`${mgmtPrefix}/staff`);
        break;
      case 'COMPANY_CREATED':
        if (['SUPER_ADMIN', 'ADMIN_EMPLOYEE'].includes(role)) navigate('/admin/companies');
        break;
      case 'PACKAGE_ASSIGNED':
        if (isOwner) navigate('/company/settings');
        break;
      case 'GENERAL':
        navigate(isOwner ? '/company/complaints' : '/staff/complaints');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!user) return undefined;
    // Removed 30-minute idle auto-logout as requested.
    // Session is now persistent until manual logout.
    return undefined;
  }, [user, logout, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-[9999] w-64 transform flex flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0',
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-600 text-white shadow-xs">
              {branding.logoUrl ? (
                <img src={fixFileUrl(branding.logoUrl)} alt="Logo" className="h-full w-full object-cover rounded-xl" />
              ) : (
                <MapPin className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight truncate text-slate-900 dark:text-white">Business Sarthi</p>
              <p className="text-[10px] font-medium tracking-wide text-slate-400 truncate">
                {t('Driving Business Forward', language)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[11px] shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Live
            </span>
            <button className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-[#2563eb] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              <Icon className="h-5 w-5" />
              {t(label, language)}
            </NavLink>
          ))}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-[1050] bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-[1001]">
          {isAlerting && (
            <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 animate-pulse">
              <Bell className="h-5 w-5 animate-bounce" />
              <span className="font-bold text-sm uppercase tracking-wider">
                Alert: Tracking Issues! Please Enable GPS and Mobile Data.
              </span>
            </div>
          )}
          {/* Topbar */}
          <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 sm:px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
            </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={toggle} className="rounded-lg p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button onClick={markRead} className="relative rounded-lg p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white sm:h-4 sm:min-w-[16px] sm:text-[10px]">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <p className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">Notifications</p>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
                      ) : notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className="cursor-pointer border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-800">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#2563eb] dark:bg-blue-900/50 dark:text-blue-300">
                  {user?.name?.[0]?.toUpperCase() || 'L'}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-white flex items-center gap-1">
                    {user?.name || 'Laxmi Kumar Sah'}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </p>
                  <p className="text-[10px] text-slate-400 font-normal">
                    {user?.designation?.name || ROLE_LABELS[user?.role] || 'Stockist'}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} title={t('Logout', language)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>
        </div>

        <main className="flex-1 p-4 lg:p-6 bg-[#f4f6f9] dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Floating Support Button for Users */}
      {user?.role !== 'SUPER_ADMIN' && (
        <Link
          to={user?.role === 'COMPANY_OWNER' ? '/company/support' : user?.role === 'STOCKIST' ? '/stockist/support' : '/staff/support'}
          className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 bg-[#2563eb] text-white px-5 py-2.5 rounded-full shadow-xl hover:bg-blue-700 transition-all font-semibold text-sm group"
        >
          <LifeBuoy className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          <span>Support</span>
        </Link>
      )}
    </div>
  );
}
