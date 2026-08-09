import { useEffect, useState, useCallback } from 'react';
import { Target, Save, Search, TrendingUp, Calendar, User, BarChart2, PieChart as PieChartIcon, ArrowUpRight, Users, LineChart as LineChartIcon } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { api } from '@/api/client';
import { Card, CardHeader, CardBody, Button, Input, Select, Table, Spinner, Badge, MonthPicker, StatCard } from '@/components/ui';
import { formatMoney, cn, todayStr } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { adToBs } from '@/lib/nepaliDate';

export default function TargetsPage() {
  const { user } = useAuth();
  const dateFormat = user?.company?.settings?.dateFormat || 'BS';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState([]);
  const [assignedTargets, setTargets] = useState([]);
  const [view, setView] = useState('dashboard'); // dashboard | assignment
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const [month, setMonth] = useState(() => {
    if (dateFormat === 'BS') {
      const bs = adToBs(new Date());
      return `${bs.year}-${String(bs.month).padStart(2, '0')}`;
    }
    return new Date().toISOString().slice(0, 7);
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [staffRes, targetRes, reportRes] = await Promise.all([
        api.get('/staff?limit=200'),
        api.get('/targets', { params: { month, calendarType: dateFormat } }),
        api.get('/targets/achievement', { params: { month, calendarType: dateFormat } })
      ]);

      const activeStaff = (staffRes.data.data.items || []).filter(s => ['STAFF', 'COMPANY_MANAGER'].includes(s.role));
      setStaff(activeStaff);

      const initial = activeStaff.map(s => ({
        staffId: s._id,
        amount: targetRes.data.data.find(t => t.staff === s._id)?.amount || 0
      }));
      setTargets(initial);

      setReportData(reportRes.data.data);
      setStats(reportRes.data.stats);
      setTrend(reportRes.data.trend || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load target data. Please ensure the backend is running and the company is associated correctly.');
    } finally {
      setLoading(false);
    }
  }, [month, dateFormat]);

  useEffect(() => {
    load();
  }, [load]);

  const updateTarget = (staffId, val) => {
    setTargets(prev => prev.map(t => t.staffId === staffId ? { ...t, amount: Number(val) || 0 } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/targets/bulk', { month, calendarType: dateFormat, targets: assignedTargets });
      alert('Targets saved successfully');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setBulkTarget = (amount) => {
    const val = Number(amount) || 0;
    setTargets(prev => prev.map(t => ({ ...t, amount: val })));
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.position?.toLowerCase().includes(search.toLowerCase())
  );

  const pieData = stats ? [
    { name: 'Achieved', value: stats.totalAchieved },
    { name: 'Remaining', value: Math.max(stats.totalTarget - stats.totalAchieved, 0) }
  ] : [];

  const barData = reportData.slice(0, 10).map(r => ({
    name: r.name,
    achieved: r.achieved,
    target: r.target
  }));

  if (loading && !stats) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Target Management</h1>
          <p className="text-sm text-slate-500">Assign and track monthly sales targets for your team.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button onClick={() => setView('dashboard')} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'dashboard' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600" : "text-slate-500")}>Dashboard</button>
          <button onClick={() => setView('assignment')} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'assignment' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600" : "text-slate-500")}>Assignment</button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in duration-300">{error}</div>}

      {view === 'dashboard' && stats && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Target} label="Total Target" value={formatMoney(stats.totalTarget)} color="blue" />
              <StatCard icon={TrendingUp} label="Total Achieved" value={formatMoney(stats.totalAchieved)} color="green" />
              <StatCard icon={Users} label="Total Staff" value={stats.staffCount} color="purple" />
              <StatCard icon={ArrowUpRight} label="Target Met" value={stats.completedStaff} sub="Employees" color="orange" />
           </div>

           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader title="Overall Achievement" icon={PieChartIcon} />
                <CardBody className="h-80 flex flex-col items-center justify-center relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={pieData}
                           innerRadius={70}
                           outerRadius={90}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                         >
                           <Cell fill="#10b981" />
                           <Cell fill="#e2e8f0" />
                         </Pie>
                         <Tooltip formatter={(v) => formatMoney(v)} />
                         <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pb-8">
                      <p className="text-3xl font-black text-slate-800 dark:text-white">
                        {stats.totalTarget > 0 ? Math.round((stats.totalAchieved / stats.totalTarget) * 100) : 0}%
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completed</p>
                   </div>
                </CardBody>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader title="Performance Trend" icon={LineChartIcon} />
                <CardBody className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                         <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                               <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                         <XAxis dataKey="date" fontSize={10} tickFormatter={(str) => str.split('-').slice(2).join('')} />
                         <YAxis fontSize={10} tickFormatter={(v) => `रू${v/1000}k`} />
                         <Tooltip formatter={(v) => formatMoney(v)} />
                         <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </CardBody>
              </Card>
           </div>

           <Card>
              <CardHeader title="Staff Progress Rankings" icon={BarChart2} />
              <CardBody>
                 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-80">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                             <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" fontSize={11} width={100} axisLine={false} tickLine={false} />
                             <Tooltip cursor={{fill: 'transparent'}} formatter={(v) => formatMoney(v)} />
                             <Bar dataKey="achieved" name="Achieved" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                             <Bar dataKey="target" name="Target" fill="#bfdbfe" radius={[0, 4, 4, 0]} barSize={12} />
                             <Legend verticalAlign="top" align="right" height={36}/>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top 5 Achievement %</p>
                       {reportData.sort((a,b) => b.percent - a.percent).slice(0, 5).map((r, i) => (
                          <div key={r.staffId} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50">
                             <span className="text-lg font-black text-slate-300">#{i+1}</span>
                             <div className="flex-1">
                                <p className="font-bold text-sm">{r.name}</p>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                   <div className={cn("h-full", r.percent >= 100 ? "bg-emerald-500" : "bg-primary-500")} style={{ width: `${Math.min(r.percent, 100)}%` }} />
                                </div>
                             </div>
                             <Badge color={r.percent >= 100 ? 'green' : 'blue'}>{r.percent.toFixed(0)}%</Badge>
                          </div>
                       ))}
                    </div>
                 </div>
              </CardBody>
           </Card>
        </div>
      )}

      <Card>
        <div className="flex flex-col border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Month:</span>
             </div>
             <MonthPicker value={month} onChange={setMonth} className="w-44" />
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {loading ? <div className="p-10 text-center"><Spinner /></div> : (
          view === 'assignment' ? (
            <>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b flex flex-wrap items-center gap-4">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions:</span>
                 <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Set for all..." className="w-32 h-9" onKeyDown={e => e.key === 'Enter' && setBulkTarget(e.target.value)} />
                    <p className="text-[10px] text-slate-500 italic">Press Enter to apply to all</p>
                 </div>
              </div>
              <Table
                columns={['Employee', 'Position', 'Target Amount', 'Actions']}
                data={filteredStaff}
                renderRow={(s) => (
                  <tr key={s._id}>
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {s.name[0]}
                        </div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-slate-500">{s.position || '—'}</td>
                    <td className="table-td">
                      <Input
                        type="number"
                        min="0"
                        className="w-40"
                        value={assignedTargets.find(t => t.staffId === s._id)?.amount || 0}
                        onChange={e => updateTarget(s._id, e.target.value)}
                      />
                    </td>
                    <td className="table-td text-xs text-slate-400 italic">Individual override</td>
                  </tr>
                )}
                mobileRender={(s) => (
                  <div key={s._id} className="p-4 space-y-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-bold">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.position || 'Staff'}</p>
                        </div>
                      </div>
                    </div>
                    <Input
                      label="Assign Target (NPR)"
                      type="number"
                      min="0"
                      value={assignedTargets.find(t => t.staffId === s._id)?.amount || 0}
                      onChange={e => updateTarget(s._id, e.target.value)}
                    />
                  </div>
                )}
              />
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                <Button onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4 mr-2" /> Save All Targets
                </Button>
              </div>
            </>
          ) : (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <Table
                columns={['Employee', 'Monthly Target', 'Achieved', 'Progress Status']}
                data={reportData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))}
                renderRow={(r) => (
                  <tr key={r.staffId}>
                    <td className="table-td">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.position || '—'}</p>
                    </td>
                    <td className="table-td font-bold">{formatMoney(r.target)}</td>
                    <td className="table-td">
                      <p className="font-bold text-emerald-600">{formatMoney(r.achieved)}</p>
                      <p className="text-[10px] text-slate-400">Total Sales</p>
                    </td>
                    <td className="table-td">
                      <div className="w-full max-w-[140px] space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                           <span className={cn(r.percent >= 100 ? "text-emerald-600" : "text-primary-600")}>
                             {r.percent.toFixed(1)}% {r.percent >= 100 ? '✓' : ''}
                           </span>
                           <span className="text-slate-400">{r.percent >= 100 ? 'Target Met' : 'Active'}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700">
                          <div className={cn("h-full transition-all duration-1000 ease-out", r.percent >= 100 ? "bg-emerald-500" : "bg-primary-500")} style={{ width: `${Math.min(r.percent, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                mobileRender={(r) => (
                  <div key={r.staffId} className="p-4 space-y-4 border-b dark:border-slate-800">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                              {r.name[0]}
                           </div>
                           <div>
                             <p className="font-bold text-slate-900 dark:text-white leading-tight">{r.name}</p>
                             <p className="text-[10px] text-slate-500 font-medium uppercase">{r.position || 'Staff'}</p>
                           </div>
                        </div>
                        <Badge color={r.percent >= 100 ? 'green' : 'blue'} className="text-[10px] font-black">{r.percent.toFixed(0)}%</Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                           <p className="text-slate-400 uppercase font-black text-[9px] mb-1">Monthly Target</p>
                           <p className="font-bold text-xs">{formatMoney(r.target)}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                           <p className="text-emerald-600 uppercase font-black text-[9px] mb-1">Achieved Sales</p>
                           <p className="font-bold text-xs text-emerald-700 dark:text-emerald-400">{formatMoney(r.achieved)}</p>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className={cn("h-full transition-all duration-1000", r.percent >= 100 ? "bg-emerald-500" : "bg-primary-500")} style={{ width: `${Math.min(r.percent, 100)}%` }} />
                        </div>
                        {r.percent < 100 && (
                          <p className="text-[9px] text-slate-400 text-right font-medium italic">Remaining: {formatMoney(r.target - r.achieved)}</p>
                        )}
                     </div>
                  </div>
                )}
              />
            </div>
          )
        )}
      </Card>
    </div>
  );
}
