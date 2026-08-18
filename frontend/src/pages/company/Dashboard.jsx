import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserCheck, UserMinus, Calendar, TrendingUp,
  Activity, Clock, Building2, ShieldCheck, MapPin,
  FileText, CreditCard, ChevronRight, LayoutGrid
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { api } from '@/api/client';
import { Card, CardHeader, CardBody, Spinner, Badge, Button, Select } from '@/components/ui';
import { formatMoney, formatDateTime, fixFileUrl, cn } from '@/lib/utils';
import LiveClock from '@/components/Clock';
import { adToBs } from '@/lib/nepaliDate';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

const StatSparkline = ({ data, color }) => (
  <div className="h-8 w-16">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function CompanyDashboard() {
  const [data, setData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('');

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/dashboard/company');
      setData(res.data);

      const dateFormat = res.data.company?.settings?.dateFormat || 'AD';
      if (dateFormat === 'BS') {
         const bs = adToBs(new Date());
         setCurrentMonth(`${bs.year}-${String(bs.month).padStart(2, '0')}`);
      } else {
         setCurrentMonth(new Date().toISOString().slice(0, 7));
      }
    } catch (e) {
      console.error('Failed to load dashboard', e);
    }
  }, []);

  useEffect(() => {
    load();
    const checkInterval = setInterval(() => {
      const now = new Date();
      let nowMonth;
      const dateFormat = data?.company?.settings?.dateFormat || 'AD';
      if (dateFormat === 'BS') {
        const bs = adToBs(now);
        nowMonth = `${bs.year}-${String(bs.month).padStart(2, '0')}`;
      } else {
        nowMonth = now.toISOString().slice(0, 7);
      }
      if (currentMonth && nowMonth !== currentMonth) load();
    }, 60000);
    return () => clearInterval(checkInterval);
  }, [load, currentMonth, data?.company?.settings?.dateFormat]);

  if (!data) return <div className="flex h-[80vh] items-center justify-center"><Spinner className="h-10 w-10" /></div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="flex flex-col items-center justify-between gap-6 p-6 sm:flex-row">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 p-2 shadow-inner dark:bg-slate-800/50">
              {data.company?.logo ? (
                <img src={fixFileUrl(data.company.logo)} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-10 w-10 text-primary-600" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{data.company?.name}</h1>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {data.company?.address || 'Nepal'}</span>
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Reg: {data.company?.registrationNumber || '—'}</span>
                <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> PAN: {data.company?.panVat || '—'}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-blue-50/50 p-4 px-6 text-center dark:bg-blue-900/10 sm:text-right">
             <LiveClock className="text-slate-900 dark:text-white" showIcon={false} />
          </div>
        </div>
      </Card>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-900/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <StatSparkline color="#10b981" data={[{value: 10}, {value: 25}, {value: 15}, {value: 30}]} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Sales</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(data.todaySales)}</p>
            <div className="flex items-center gap-1 text-xs font-medium">
              <span className={cn(data.salesTrend >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {data.salesTrend >= 0 ? '↑' : '↓'} {Math.abs(data.salesTrend)}%
              </span>
              <span className="text-slate-400">vs yesterday</span>
            </div>
          </div>
        </Card>

        {/* Present Staff */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20">
              <Users className="h-6 w-6" />
            </div>
            <StatSparkline color="#3b82f6" data={[{value: 20}, {value: 28}, {value: 22}, {value: 35}]} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Present Staff</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.checkedInToday}</p>
            <p className="text-xs font-medium text-slate-400">of {data.totalStaff} total staff</p>
          </div>
        </Card>

        {/* Absent Staff */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600 dark:bg-orange-900/20">
              <UserMinus className="h-6 w-6" />
            </div>
            <StatSparkline color="#f59e0b" data={[{value: 5}, {value: 2}, {value: 8}, {value: 4}]} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Absent Staff</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.absentToday}</p>
            <p className="text-xs font-medium text-slate-400">
              {data.totalStaff > 0 ? ((data.absentToday / data.totalStaff) * 100).toFixed(1) : 0}% of total staff
            </p>
          </div>
        </Card>

        {/* On Leave */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-900/20">
              <Calendar className="h-6 w-6" />
            </div>
            <StatSparkline color="#8b5cf6" data={[{value: 2}, {value: 3}, {value: 1}, {value: 3}]} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">On Leave</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.onLeaveToday}</p>
            <p className="text-xs font-medium text-slate-400">
              {data.totalStaff > 0 ? ((data.onLeaveToday / data.totalStaff) * 100).toFixed(1) : 0}% of total staff
            </p>
          </div>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Monthly Sales Overview */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Monthly Sales Overview"
            action={
              <Select value="this-month" options={[{value: 'this-month', label: 'This Month'}]} className="w-32 h-9 text-xs" onChange={() => {}} />
            }
          />
          <CardBody>
            <div className="mb-6 space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase">Total Sales</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatMoney(data.monthlySales)}</p>
                <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 mb-1">
                   ↑ {data.monthlyTrend}% <span className="text-[10px] font-medium text-slate-400 ml-1">vs last month</span>
                </div>
              </div>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.monthlySalesGraph}>
                   <defs>
                     <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis
                     dataKey="date"
                     axisLine={false}
                     tickLine={false}
                     tick={{fontSize: 10, fill: '#94a3b8'}}
                     tickFormatter={(val) => val.split('-').slice(1).join('/')}
                   />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                   <Tooltip
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     formatter={(v) => formatMoney(v)}
                   />
                   <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Product Performance */}
        <Card className="lg:col-span-2">
           <CardHeader
             title="Product Performance"
             subtitle="(This Month)"
             action={<Select value="this-month" options={[{value: 'this-month', label: 'This Month'}]} className="w-32 h-9 text-xs" onChange={() => {}} />}
           />
           <CardBody>
             <div className="flex flex-col items-center gap-6">
                <div className="relative h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.productSales}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="amount"
                      >
                        {data.productSales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Sales</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(data.monthlySales)}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase">NPR</p>
                  </div>
                </div>

                <div className="w-full space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b pb-2">
                      <span>Product</span>
                      <div className="flex gap-10">
                         <span>Sales (NPR)</span>
                         <span className="w-6 text-right">%</span>
                      </div>
                   </div>
                   <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {data.productSales.map((p, i) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors">{p.name}</p>
                           </div>
                           <div className="flex items-center gap-8 font-mono">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{p.amount.toLocaleString()}</p>
                              <p className="w-6 text-right text-xs font-bold text-slate-500">{p.percent}%</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <Button variant="outline" size="sm" className="w-full text-xs font-bold group" onClick={() => window.location.href='/company/inventory'}>
                     View All Products <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                   </Button>
                </div>
             </div>
           </CardBody>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader
          title="Recent Activity Log"
          action={<Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => window.location.href='/company/reports'}>View All</Button>}
        />
        <CardBody className="p-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800/30">
                    <th className="px-6 py-4">Activity</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentActivities.map((act) => (
                    <tr key={act._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <ActivityIcon action={act.action} />
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                             {act.action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                             <span className="ml-1 text-slate-400 font-normal">performed</span>
                           </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{act.user?.name || 'System'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-slate-500">{formatDateTime(act.createdAt)}</p>
                      </td>
                    </tr>
                  ))}
                  {!data.recentActivities.length && (
                    <tr>
                      <td colSpan="3" className="px-6 py-10 text-center text-sm text-slate-400 italic">No recent activity logs available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </CardBody>
      </Card>
    </div>
  );
}

function ActivityIcon({ action }) {
  const base = "h-8 w-8 rounded-lg flex items-center justify-center";
  if (action.includes('SALE')) return <div className={cn(base, "bg-emerald-50 text-emerald-600")}><TrendingUp className="h-4 w-4" /></div>;
  if (action.includes('STAFF') || action.includes('USER')) return <div className={cn(base, "bg-blue-50 text-blue-600")}><Users className="h-4 w-4" /></div>;
  if (action.includes('INVENTORY')) return <div className={cn(base, "bg-orange-50 text-orange-600")}><LayoutGrid className="h-4 w-4" /></div>;
  if (action.includes('CHECK')) return <div className={cn(base, "bg-purple-50 text-purple-600")}><Clock className="h-4 w-4" /></div>;
  if (action.includes('LEAVE')) return <div className={cn(base, "bg-rose-50 text-rose-600")}><Calendar className="h-4 w-4" /></div>;
  return <div className={cn(base, "bg-slate-100 text-slate-600")}><Activity className="h-4 w-4" /></div>;
}
