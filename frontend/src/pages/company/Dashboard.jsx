import { useEffect, useState, useCallback } from 'react';
import { Users, UserCheck, TrendingUp, Activity, Clock, Building2, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { api } from '@/api/client';
import { Card, CardHeader, CardBody, Spinner, Badge } from '@/components/ui';
import { formatMoney, formatDateTime, fixFileUrl } from '@/lib/utils';
import LiveClock from '@/components/Clock';

export default function CompanyDashboard() {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const { data: res } = await api.get('/dashboard/company');
    setData(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Company Profile & Clock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex h-full flex-col sm:flex-row">
            <div className="flex flex-1 items-center gap-5 p-6">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-slate-50 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                {data.company?.logo ? (
                  <img src={fixFileUrl(data.company.logo)} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary-600">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold">{data.company?.name}</h1>
                <div className="mt-1 flex flex-wrap gap-3">
                   <Badge color="blue" variant="outline" className="flex items-center gap-1">
                     <ShieldCheck className="h-3 w-3" /> {data.company?.package?.name || 'Standard'}
                   </Badge>
                   <p className="text-sm text-slate-500">{data.company?.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 sm:border-l sm:border-t-0">
               <LiveClock />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
           <Card className="p-5 flex flex-col justify-center text-center">
              <div className="mx-auto mb-2 rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-xl font-bold">{formatMoney(data.todaySales)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</p>
           </Card>
           <Card className="p-5 flex flex-col justify-center text-center">
              <div className="mx-auto mb-2 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30">
                <UserCheck className="h-5 w-5" />
              </div>
              <p className="text-xl font-bold">{data.checkedInToday}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
           </Card>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="This Month Sales" subtitle="Daily revenue trend" />
          <CardBody className="h-72">
             {data.monthlySalesGraph?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.monthlySalesGraph}>
                   <defs>
                     <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" hide />
                   <YAxis hide />
                   <Tooltip
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     formatter={(v) => formatMoney(v)}
                   />
                   <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#salesColor)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-full items-center justify-center text-slate-400">No sales data for this month</div>
             )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Product Performance" subtitle="Top 10 products by revenue (This Month)" />
          <CardBody className="h-72">
             {data.productSales?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.productSales} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis type="category" dataKey="name" width={100} fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     formatter={(v) => formatMoney(v)}
                   />
                   <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-full items-center justify-center text-slate-400">No product sales recorded</div>
             )}
          </CardBody>
        </Card>
      </div>

      {/* Stats & Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
         <Card className="lg:col-span-1">
           <CardHeader title="Staff Stats" />
           <CardBody className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">Total Registered</span>
                 </div>
                 <span className="font-bold">{data.totalStaff}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium">Active Accounts</span>
                 </div>
                 <span className="font-bold">{data.activeStaff}</span>
              </div>
           </CardBody>
         </Card>

         <Card className="lg:col-span-2">
           <CardHeader title="Recent Activity Log" />
           <CardBody className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentActivities?.map((act) => (
                  <div key={act._id} className="flex items-start gap-3 p-4 hover:bg-slate-50/50">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-slate-900 dark:text-slate-100">{act.user?.name || 'System'}</span>
                        <span className="ml-1 text-slate-500">performed {act.action.replaceAll('_', ' ').toLowerCase()}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(act.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {!data.recentActivities?.length && (
                  <div className="p-8 text-center text-sm text-slate-400 italic">No recent activities found</div>
                )}
              </div>
           </CardBody>
         </Card>
      </div>
    </div>
  );
}

