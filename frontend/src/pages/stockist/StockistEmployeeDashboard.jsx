import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarOff, Clock as ClockIcon, MapPin,
  AlertTriangle, Mail, Phone, Building2, Calendar,
  Fingerprint, Activity, Target, TrendingUp, ChevronRight,
  Quote, CalendarDays, UserCheck, Timer, FileText, CreditCard
} from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { Card, CardBody, Spinner, Badge, Button, Modal, Input, Select, DatePicker, Textarea } from '@/components/ui';
import { formatTime, cn, formatMoney, fixFileUrl, formatDate } from '@/lib/utils';
import LiveClock from '@/components/Clock';

export default function StockistEmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [outlets, setOutlets] = useState([]);
  const [modal, setModal] = useState(null); // 'payment' | 'expense'
  const [payForm, setPayForm] = useState({
    distributorId: '',
    amount: 0,
    method: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'MISC',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    paidTo: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isTrackingNeeded = data ? (data.checkInStatus && !data.checkOutStatus) : false;
  const { status: trackingStatus } = useLocationTracker(isTrackingNeeded);

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/dashboard/staff');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    load();
    api.get('/distributors').then(res => {
      setOutlets(res.data?.data?.items || res.data?.data || []);
    }).catch(() => {});
  }, [load]);

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payForm.distributorId) {
      setFormError('Please select an outlet');
      return;
    }
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/payments', payForm);
      setModal(null);
      setPayForm({ distributorId: '', amount: 0, method: 'CASH', paymentDate: new Date().toISOString().split('T')[0], remarks: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      setFormError('Please fill in title and amount');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/expenses', expenseForm);
      setModal(null);
      setExpenseForm({ title: '', category: 'MISC', amount: 0, expenseDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', paidTo: '', remarks: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
      <p className="text-slate-500 mb-6">{error}</p>
      <Button onClick={load}>Try Again</Button>
    </div>
  );

  if (!data) return <div className="flex h-screen items-center justify-center"><Spinner className="h-10 w-10" /></div>;

  const { stats, profile, greeting, stockistStats } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20 animate-in fade-in duration-500">

      {/* 1. Header Profile & Clock */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardBody className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-slate-50 shadow-sm overflow-hidden bg-slate-100">
                {profile.profilePhoto ? (
                  <img src={fixFileUrl(profile.profilePhoto)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary-600 font-bold text-2xl uppercase">
                    {profile.name[0]}
                  </div>
                )}
              </div>
              <div className={cn("absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white", data.checkInStatus ? "bg-emerald-500" : "bg-slate-300")} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {greeting}, {profile.name} 👋
              </h1>
              <p className="text-slate-500 font-medium">Have a productive day ahead!</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="p-1 rounded-md bg-blue-50 text-blue-600"><Building2 className="h-3.5 w-3.5" /></div>
                    {profile.company}
                 </div>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="p-1 rounded-md bg-purple-50 text-purple-600"><UserCheck className="h-3.5 w-3.5" /></div>
                    {profile.position}
                 </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8 border-l border-slate-100 pl-10">
             <LiveClock showIcon={false} />
             <div className="text-right space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                   <span className="text-slate-400 font-medium">Check In:</span>
                   <span className="font-bold text-slate-800">{data.checkInTime ? formatTime(data.checkInTime) : "--:-- --"}</span>
                </div>
                <div className="flex justify-between gap-4">
                   <span className="text-slate-400 font-medium">Check Out:</span>
                   <span className="font-bold text-slate-800">{data.checkOutTime ? formatTime(data.checkOutTime) : "--:-- --"}</span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t border-slate-100">
                   <span className="text-slate-400 font-medium">Shift Status:</span>
                   <span className={cn("font-black px-2 py-0.5 rounded text-[10px]", (data.checkInStatus && !data.checkOutStatus) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {(data.checkInStatus && !data.checkOutStatus) ? "ACTIVE" : "INACTIVE"}
                   </span>
                </div>
             </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Row 1: Attendance Card & Sales Target Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Attendance Card */}
         <Card className="p-6 border-none shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CalendarDays className="h-5 w-5" /></div>
                  <div>
                     <h3 className="font-bold text-slate-900 text-sm">Attendance</h3>
                     <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Monthly working days record</p>
                  </div>
               </div>
               <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Current Period</span>
            </div>
            <div className="grid grid-cols-3 gap-3 my-2">
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Present</p>
                  <p className="text-xl font-black text-slate-900">{stats.attendance.present} <span className="text-xs text-slate-400 font-normal">Days</span></p>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Absent</p>
                  <p className="text-xl font-black text-rose-600">{Math.max(stats.attendance.totalDays - stats.attendance.present - stats.leaves.taken, 0)} <span className="text-xs text-slate-400 font-normal">Days</span></p>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Leave</p>
                  <p className="text-xl font-black text-amber-600">{stats.leaves.taken} <span className="text-xs text-slate-400 font-normal">Days</span></p>
               </div>
            </div>
            <div className="mt-4">
               <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${stats.attendance.percent}%` }} />
               </div>
               <div className="flex justify-between mt-2 text-[11px] font-bold text-slate-400">
                  <span>{stats.attendance.percent}% Attendance</span>
                  <span>{stats.attendance.totalDays} Days</span>
               </div>
            </div>
         </Card>

         {/* Sales Target Card */}
         <Card className="p-6 border-none shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Target className="h-5 w-5" /></div>
                  <div>
                     <h3 className="font-bold text-slate-900 text-sm">Sales Target</h3>
                     <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Cycle</p>
                  </div>
               </div>
               <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Active Cycle</span>
            </div>
            <div className="grid grid-cols-3 gap-3 my-2">
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-sm sm:text-lg font-black text-slate-900">{formatMoney(stats.targets.total, 'Rs.')}</p>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Achieved</p>
                  <p className="text-sm sm:text-lg font-black text-emerald-600">{formatMoney(stats.targets.achieved, 'Rs.')}</p>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                  <p className="text-sm sm:text-lg font-black text-orange-600">{formatMoney(stats.targets.remaining, 'Rs.')}</p>
               </div>
            </div>
            <div className="mt-4">
               <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>Progress Status</span>
                  <span>{stats.targets.percent}%</span>
               </div>
               <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${Math.min(stats.targets.percent, 100)}%` }} />
               </div>
            </div>
         </Card>
      </div>

      {/* 3. Row 2: Invoice & Dispatch Card & Payment & Expenses Card */}
      {stockistStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Invoice & Dispatch */}
           <Card className="border-none shadow-sm p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
                    <div>
                       <h3 className="font-bold text-slate-900 text-sm">Invoice & Dispatch</h3>
                       <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Order lifecycle tracker</p>
                    </div>
                 </div>
                 <button className="text-xs font-bold text-primary-600 hover:underline" onClick={() => navigate('/stockist/dispatch-payment')}>Manage All</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                       <div className="h-2 w-2 rounded-full bg-blue-500" />
                       <span className="text-xs font-bold text-slate-600">Invoice Issued Today</span>
                    </div>
                    <Badge color="blue" className="font-black px-3 py-1 text-sm">{stockistStats.invoiceIssuedToday}</Badge>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                       <div className="h-2 w-2 rounded-full bg-amber-500" />
                       <span className="text-xs font-bold text-slate-600">Pending Invoice to Dispatch</span>
                    </div>
                    <Badge color="yellow" className="font-black px-3 py-1 text-sm">{stockistStats.pendingInvoiceToDispatch}</Badge>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                       <div className="h-2 w-2 rounded-full bg-rose-500" />
                       <span className="text-xs font-bold text-slate-600">Old Invoice to Dispatch</span>
                    </div>
                    <Badge color="red" className="font-black px-3 py-1 text-sm">{stockistStats.oldInvoiceToDispatch}</Badge>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                       <div className="h-2 w-2 rounded-full bg-emerald-500" />
                       <span className="text-xs font-bold text-slate-600">Completed Dispatch Today</span>
                    </div>
                    <Badge color="green" className="font-black px-3 py-1 text-sm">{stockistStats.completedDispatchToday}</Badge>
                 </div>
              </div>
           </Card>

           {/* Payment & Expenses */}
           <Card className="border-none shadow-sm p-6 flex flex-col justify-between">
              <div>
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CreditCard className="h-5 w-5" /></div>
                       <div>
                          <h3 className="font-bold text-slate-900 text-sm">Payment & Expenses</h3>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Financial summary</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">Currency: NPR</span>
                 </div>
                 <div className="space-y-4 my-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                       <span className="text-slate-500">Payments Collected Today:</span>
                       <span className="text-emerald-600 font-black text-base">{formatMoney(stockistStats.paymentCollectedToday, 'NPR ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                       <span className="text-slate-500">Outstanding Outlet Dues:</span>
                       <span className="text-slate-900 font-black text-base">{formatMoney(stockistStats.outletsOutstandingDue, 'NPR ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold border-t border-slate-100 pt-3">
                       <span className="text-slate-500 uppercase tracking-wider">TODAY'S EXPENSES:</span>
                       <span className="text-slate-900 font-black text-base">{formatMoney(stockistStats.expensesToday, 'NPR ')}</span>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <Button className="bg-primary-600 hover:bg-primary-700 text-xs font-bold py-3 rounded-xl shadow-sm" onClick={() => setModal('payment')}>
                    + Record Payment
                 </Button>
                 <Button variant="outline" className="text-xs font-bold py-3 rounded-xl border-slate-200 hover:bg-slate-50" onClick={() => setModal('expense')}>
                    + Add Expense
                 </Button>
              </div>
           </Card>
        </div>
      )}

      {/* 4. Row 3: Upcoming Holidays & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Upcoming Holidays */}
         <Card className="border-none shadow-sm flex flex-col justify-between">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Holidays</h3>
               </div>
               <button className="text-xs font-bold text-primary-600 hover:underline" onClick={() => navigate('/stockist/holidays')}>View All</button>
            </div>
            <CardBody className="flex-1 space-y-4">
               {data.upcomingHolidays.map((h, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                           <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{h.name}</p>
                           <p className="text-[10px] font-medium text-slate-400">{formatDate(h.startDate)}</p>
                        </div>
                     </div>
                     <Badge color="blue" className="text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">
                        {Math.ceil((new Date(h.startDate) - new Date()) / 86400000)} Days Left
                     </Badge>
                  </div>
               ))}
               {!data.upcomingHolidays.length && <p className="text-center text-sm text-slate-400 italic py-10">No upcoming holidays scheduled</p>}
            </CardBody>
            <button className="w-full p-4 text-xs font-bold text-primary-600 flex items-center justify-center gap-2 hover:bg-slate-50 border-t border-slate-50 transition-colors" onClick={() => navigate('/stockist/holidays')}>
               View full holiday calendar &rarr;
            </button>
         </Card>

         {/* Quick Actions (Check In / Check Out / Apply for Leave) */}
         <div className="space-y-4 flex flex-col justify-between">
            <Button className="h-20 rounded-2xl bg-primary-600 border-none shadow-lg shadow-primary-100 group w-full" onClick={() => navigate('/stockist/attendance')}>
               <div className="flex items-center justify-between gap-4 w-full px-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-full bg-white/20 group-hover:scale-110 transition-transform"><Fingerprint className="h-6 w-6 text-white" /></div>
                     <div className="text-left">
                        <p className="text-lg font-black leading-tight uppercase tracking-tight text-white">Check In</p>
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Start Your Day</p>
                     </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
               </div>
            </Button>
            <Button className="h-20 rounded-2xl bg-emerald-600 border-none shadow-lg shadow-emerald-100 group w-full" onClick={() => navigate('/stockist/attendance')}>
               <div className="flex items-center justify-between gap-4 w-full px-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-full bg-white/20 group-hover:scale-110 transition-transform"><Fingerprint className="h-6 w-6 text-white" /></div>
                     <div className="text-left">
                        <p className="text-lg font-black leading-tight uppercase tracking-tight text-white">Check Out</p>
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">End Your Day</p>
                     </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
               </div>
            </Button>
            <Button variant="outline" className="h-20 rounded-2xl border-2 border-indigo-100 bg-white hover:bg-indigo-50 shadow-sm group w-full" onClick={() => navigate('/stockist/leaves')}>
               <div className="flex items-center justify-between gap-4 w-full px-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform"><CalendarOff className="h-6 w-6" /></div>
                     <div className="text-left">
                        <p className="text-lg font-black leading-tight text-slate-800 uppercase tracking-tight">Apply for Leave</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan your time off</p>
                     </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-slate-300 group-hover:translate-x-1 transition-transform" />
               </div>
            </Button>
         </div>
      </div>

      {/* 5. Quote Footer with Mountain BG */}
      <div className="relative mt-12 pt-10 pb-6 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900">
         <div className="relative z-10 px-8 flex items-start gap-4">
            <Quote className="h-8 w-8 text-primary-300 rotate-180 shrink-0" />
            <p className="text-lg md:text-xl font-bold italic text-slate-600 leading-relaxed max-w-2xl">
               Stay focused, stay positive, and keep pushing towards your goals! 🚀
            </p>
         </div>

         {/* Mountain Graphic Simulation */}
         <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 md:opacity-100">
            <svg width="300" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M0 150L80 60L160 150H0Z" fill="#CBD5E1"/>
               <path d="M120 150L200 40L280 150H120Z" fill="#E2E8F0"/>
               <path d="M220 150L300 0V150H220Z" fill="#3B82F6"/>
               <path d="M280 30L300 0L300 60L280 30Z" fill="white" fillOpacity="0.4"/>
            </svg>
         </div>
      </div>

      {/* RECORD OUTLET PAYMENT MODAL */}
      <Modal open={modal === 'payment'} onClose={() => setModal(null)} title="Record Outlet Payment">
        {formError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>}
        <form onSubmit={submitPayment} className="space-y-4">
          <Select
            label="Select Outlet *"
            required
            value={payForm.distributorId}
            onChange={(e) => setPayForm({ ...payForm, distributorId: e.target.value })}
            options={[
              { value: '', label: 'Select Outlet...' },
              ...outlets.map(o => ({ value: o._id, label: `${o.name} (Due: ${formatMoney(o.outstandingBalance, 'Rs.')})` }))
            ]}
          />
          <Input
            label="Amount Received *"
            type="number"
            required
            min="1"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />
          <Select
            label="Payment Method *"
            required
            value={payForm.method}
            onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'CHEQUE', label: 'Cheque' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'ONLINE', label: 'Online / QR' }
            ]}
          />
          <DatePicker
            label="Payment Date"
            value={payForm.paymentDate}
            onChange={(val) => setPayForm({ ...payForm, paymentDate: val })}
          />
          <Textarea
            label="Remarks"
            value={payForm.remarks}
            onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
            placeholder="Notes or reference number..."
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Record Payment (FIFO)</Button>
          </div>
        </form>
      </Modal>

      {/* ADD EXPENSE MODAL */}
      <Modal open={modal === 'expense'} onClose={() => setModal(null)} title="Add Office Expense">
        {formError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>}
        <form onSubmit={submitExpense} className="space-y-4">
          <Input
            label="Expense Title *"
            required
            placeholder="e.g. Office Rent, Electricity Bill, Staff Lunch"
            value={expenseForm.title}
            onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category *"
              required
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              options={[
                { value: 'RENT', label: 'Rent' },
                { value: 'UTILITIES', label: 'Utilities (Electricity/Water)' },
                { value: 'SALARY', label: 'Staff Salary' },
                { value: 'FUEL', label: 'Fuel & Transport' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'SUPPLIES', label: 'Office Supplies' },
                { value: 'MARKETING', label: 'Marketing' },
                { value: 'TAX', label: 'Tax & Fees' },
                { value: 'MISC', label: 'Miscellaneous' }
              ]}
            />
            <Input
              label="Amount (NPR) *"
              type="number"
              required
              min="0"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Expense Date"
              value={expenseForm.expenseDate}
              onChange={(val) => setExpenseForm({ ...expenseForm, expenseDate: val })}
            />
            <Select
              label="Payment Method"
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'ONLINE', label: 'Online' }
              ]}
            />
          </div>
          <Input
            label="Paid To / Vendor"
            placeholder="e.g. Nepal Electricity Authority"
            value={expenseForm.paidTo}
            onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
          />
          <Textarea
            label="Remarks"
            value={expenseForm.remarks}
            onChange={(e) => setExpenseForm({ ...expenseForm, remarks: e.target.value })}
            placeholder="Additional notes..."
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Expense</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
