import { useEffect, useState, useCallback } from 'react';
import { Building2, Users, Package, ShieldCheck, Store, Inbox, TrendingUp, DollarSign, ArrowUpRight, BarChart3, Layers } from 'lucide-react';
import { api } from '@/api/client';
import { Card, CardHeader, CardBody, Spinner, Badge, Table } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/dashboard/super');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load super admin dashboard', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time platform analytics, financial performance, and tenant distribution.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          System Live & Operational
        </div>
      </div>

      {/* 3D-styled Gradient Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/10 transform transition hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Monthly Revenue</p>
            <div className="rounded-2xl bg-white/10 p-3"><DollarSign className="h-6 w-6" /></div>
          </div>
          <h3 className="text-3xl font-black mt-3">{formatMoney(data.monthlyRevenue || 0, 'NPR ')}</h3>
          <p className="text-[11px] text-blue-100 mt-2 flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" /> Projected recurring ARR</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-500/10 transform transition hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Net Platform Profits</p>
            <div className="rounded-2xl bg-white/10 p-3"><TrendingUp className="h-6 w-6" /></div>
          </div>
          <h3 className="text-3xl font-black mt-3">{formatMoney(data.monthlyProfits || 0, 'NPR ')}</h3>
          <p className="text-[11px] text-emerald-100 mt-2">After deducting operational expenses</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-violet-500/10 transform transition hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-100">Active Companies</p>
            <div className="rounded-2xl bg-white/10 p-3"><Building2 className="h-6 w-6" /></div>
          </div>
          <h3 className="text-3xl font-black mt-3">{data.totalCompanies || 0}</h3>
          <p className="text-[11px] text-violet-100 mt-2">{data.totalStockists || 0} registered stockists</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white shadow-xl shadow-orange-500/10 transform transition hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-100">Total System Users</p>
            <div className="rounded-2xl bg-white/10 p-3"><Users className="h-6 w-6" /></div>
          </div>
          <h3 className="text-3xl font-black mt-3">{data.totalStaff || 0}</h3>
          <p className="text-[11px] text-orange-100 mt-2">Staff & managers active</p>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border-none shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Monthly Expenses</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatMoney(data.monthlyExpenses || 0, 'NPR ')}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><BarChart3 className="h-6 w-6" /></div>
        </Card>

        <Card className="p-5 border-none shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Platform Inquiries</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{data.inquiriesCount || 0}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Inbox className="h-6 w-6" /></div>
        </Card>

        <Card className="p-5 border-none shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Active Packages</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{data.activePackages || 0}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Package className="h-6 w-6" /></div>
        </Card>
      </div>

      {/* Most Selling Packages & Breakdown */}
      <Card>
        <CardHeader title="Most Selling Packages & Plan Distribution" subtitle="Subscription tier popularity across registered businesses" />
        <div className="p-6 space-y-4">
          {data.packagesBreakdown?.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-6">No package subscription data available yet.</p>
          ) : (
            data.packagesBreakdown?.map((pkg, idx) => {
              const total = data.totalCompanies || 1;
              const pct = Math.round((pkg.count / total) * 100);
              return (
                <div key={pkg.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 flex items-center justify-center text-xs font-bold">#{idx + 1}</span>
                      {pkg.name}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{pkg.count} Companies ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
