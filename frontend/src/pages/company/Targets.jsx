import { useEffect, useState, useCallback } from 'react';
import { Target, Save, Search, TrendingUp, Calendar, User } from 'lucide-react';
import { api } from '@/api/client';
import { Card, CardHeader, CardBody, Button, Input, Select, Table, Spinner, Badge, MonthPicker } from '@/components/ui';
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
  const [view, setView] = useState('assignment'); // assignment | report
  const [reportData, setReportData] = useState([]);
  const [search, setSearch] = useState('');

  const [month, setMonth] = useState(() => {
    if (dateFormat === 'BS') {
      const bs = adToBs(new Date());
      return `${bs.year}-${String(bs.month).padStart(2, '0')}`;
    }
    return new Date().toISOString().slice(0, 7);
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, targetRes] = await Promise.all([
        api.get('/staff?limit=200'),
        api.get('/targets', { params: { month, calendarType: dateFormat } })
      ]);

      const activeStaff = (staffRes.data.data.items || []).filter(s => ['STAFF', 'COMPANY_MANAGER'].includes(s.role));
      setStaff(activeStaff);

      // Initialize internal state for editing
      const initial = activeStaff.map(s => ({
        staffId: s._id,
        amount: targetRes.data.data.find(t => t.staff === s._id)?.amount || 0
      }));
      setTargets(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, dateFormat]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/targets/achievement', { params: { month, calendarType: dateFormat } });
      setReportData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, dateFormat]);

  useEffect(() => {
    if (view === 'assignment') load();
    else loadReport();
  }, [view, load, loadReport]);

  const updateTarget = (staffId, val) => {
    setTargets(prev => prev.map(t => t.staffId === staffId ? { ...t, amount: Number(val) || 0 } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/targets/bulk', { month, calendarType: dateFormat, targets: assignedTargets });
      alert('Targets saved successfully');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Target Management</h1>
          <p className="text-sm text-slate-500">Assign and track monthly sales targets for your team.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button onClick={() => setView('assignment')} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'assignment' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600" : "text-slate-500")}>Assignment</button>
          <button onClick={() => setView('report')} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'report' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600" : "text-slate-500")}>Achievement</button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Select Month:</span>
             </div>
             <MonthPicker value={month} onChange={setMonth} className="w-44" />
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {loading ? <div className="p-10"><Spinner /></div> : (
          view === 'assignment' ? (
            <>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b flex flex-wrap items-center gap-4">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions:</span>
                 <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Set for all..." className="w-32 h-9" onKeyDown={e => e.key === 'Enter' && setBulkTarget(e.target.value)} />
                    <p className="text-[10px] text-slate-500 italic">Press Enter to apply to all shown</p>
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
                        prefix="NPR"
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
            <Table
              columns={['Employee', 'Monthly Target', 'Achieved', 'Status']}
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
                    <p className="text-[10px] text-slate-400">Sales + Invoices</p>
                  </td>
                  <td className="table-td">
                    <div className="w-full max-w-[120px] space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                         <span>{r.percent.toFixed(1)}%</span>
                         <span className={cn(r.percent >= 100 ? "text-emerald-500" : "text-primary-500")}>
                           {r.percent >= 100 ? 'Completed' : 'Progress'}
                         </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className={cn("h-full transition-all", r.percent >= 100 ? "bg-emerald-500" : "bg-primary-500")} style={{ width: `${Math.min(r.percent, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              mobileRender={(r) => (
                <div key={r.staffId} className="p-4 space-y-3 border-b">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.position || 'Staff'}</p>
                      </div>
                      <Badge color={r.percent >= 100 ? 'green' : 'blue'}>{r.percent.toFixed(0)}%</Badge>
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                         <p className="text-slate-400 uppercase font-bold text-[9px]">Target</p>
                         <p className="font-bold">{formatMoney(r.target)}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded">
                         <p className="text-emerald-600 uppercase font-bold text-[9px]">Achieved</p>
                         <p className="font-bold text-emerald-700">{formatMoney(r.achieved)}</p>
                      </div>
                   </div>
                   <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full", r.percent >= 100 ? "bg-emerald-500" : "bg-primary-500")} style={{ width: `${Math.min(r.percent, 100)}%` }} />
                   </div>
                </div>
              )}
            />
          )
        )}
      </Card>
    </div>
  );
}
