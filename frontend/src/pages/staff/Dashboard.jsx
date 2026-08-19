import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarOff, Clock as ClockIcon, MapPin,
  AlertTriangle, Mail, Phone, Building2, Calendar,
  Fingerprint, Activity, Target, TrendingUp, ChevronRight,
  Quote, CalendarDays, UserCheck, Timer
} from 'lucide-react';
import { api } from '@/api/client';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Device } from '@capacitor/device';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { Card, CardBody, Spinner, Badge, Button } from '@/components/ui';
import { formatTime, cn, formatMoney, fixFileUrl, formatDate } from '@/lib/utils';
import { t } from '@/lib/i18n';
import LiveClock from '@/components/Clock';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isTrackingNeeded = data ? (data.checkInStatus && !data.checkOutStatus) : false;
  const { status: trackingStatus, intervalMinutes, lastPing } = useLocationTracker(isTrackingNeeded);

  const language = user?.company?.settings?.language || 'English';

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/staff');
      setData(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
      <p className="text-slate-500 mb-6">{error}</p>
      <Button onClick={load}>Try Again</Button>
    </div>
  );

  if (!data) return <div className="flex h-screen items-center justify-center"><Spinner className="h-10 w-10" /></div>;

  const { stats, profile, greeting } = data;

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
          <div className="hidden lg:block border-l border-slate-100 pl-10">
             <LiveClock showIcon={false} />
          </div>
        </CardBody>
      </Card>

      {/* 2. Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="p-4 border-none shadow-sm">
            <div className="flex items-center gap-4">
               <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><CalendarDays className="h-6 w-6" /></div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Leaves This Month</p>
                  <p className="text-xl font-black text-slate-900">{stats.leaves.taken} <span className="text-slate-400 text-sm font-medium">/ {stats.leaves.total} Days</span></p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stats.leaves.remaining} leaves remaining</p>
               </div>
            </div>
         </Card>
         <Card className="p-4 border-none shadow-sm">
            <div className="flex items-center gap-4">
               <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><CalendarDays className="h-6 w-6" /></div>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Present This Month</p>
                  <p className="text-xl font-black text-slate-900">{stats.attendance.present} <span className="text-slate-400 text-sm font-medium">/ {stats.attendance.totalDays} Days</span></p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stats.attendance.percent}% Attendance</p>
               </div>
            </div>
         </Card>
         <Card className="p-4 border-none shadow-sm">
            <div className="flex items-center gap-4">
               <div className="rounded-xl bg-purple-50 p-3 text-purple-600"><Activity className="h-6 w-6" /></div>
               <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Shift Status</p>
                  <div className="mt-1">
                     <Badge color={data.checkInStatus ? "green" : "gray"} className="rounded-full py-1 px-3">
                        <div className={cn("h-2 w-2 rounded-full mr-2", data.checkInStatus ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                        {data.checkInStatus ? "Shift Active" : "Off Duty"}
                     </Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">All systems operational</p>
               </div>
            </div>
         </Card>
         <Card className="p-4 border-none shadow-sm">
            <div className="flex items-center gap-4">
               <div className="rounded-xl bg-orange-50 p-3 text-orange-600"><Timer className="h-6 w-6" /></div>
               <div className="flex-1 text-sm font-bold">
                  <p className="text-xs text-slate-400 uppercase mb-2">Today's Schedule</p>
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-slate-500 font-medium">Check In</span>
                     <span className="text-slate-900">{data.checkInTime ? formatTime(data.checkInTime) : "09:15 AM"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 font-medium">Check Out</span>
                     <span className="text-slate-900">{data.checkOutTime ? formatTime(data.checkOutTime) : "--:-- --"}</span>
                  </div>
               </div>
            </div>
         </Card>
      </div>

      {/* 3. Target Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-5 border-none shadow-sm bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className="p-2.5 rounded-full bg-blue-100 text-blue-600"><Target className="h-5 w-5" /></div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Target</p>
                  <p className="text-lg font-bold text-slate-900">{formatMoney(stats.targets.total, 'Rs.')}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">This Month</p>
               </div>
            </div>
         </Card>
         <Card className="p-5 border-none shadow-sm bg-emerald-50/30">
            <div className="flex items-center gap-4">
               <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Achieved</p>
                  <p className="text-lg font-bold text-emerald-600">{formatMoney(stats.targets.achieved, 'Rs.')}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">{stats.targets.percent}% Achieved</p>
               </div>
            </div>
         </Card>
         <Card className="p-5 border-none shadow-sm bg-orange-50/30">
            <div className="flex items-center gap-4">
               <div className="p-2.5 rounded-full bg-orange-100 text-orange-600"><PieChartIcon className="h-5 w-5" /></div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining Target</p>
                  <p className="text-lg font-bold text-orange-600">{formatMoney(stats.targets.remaining, 'Rs.')}</p>
                  <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase">{(100 - stats.targets.percent).toFixed(2)}% Remaining</p>
               </div>
            </div>
         </Card>
      </div>

      {/* 4. Progress Bars & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            {/* Sales Progress */}
            <Card className="p-6 border-none shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="text-blue-600"><Activity className="h-6 w-6" /></div>
                  <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">Sales Progress</h3>
               </div>
               <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-blue-600 transition-all duration-1000 ease-out flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${Math.min(stats.targets.percent, 100)}%` }}>
                     {stats.targets.percent}%
                  </div>
               </div>
               <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  <span>{formatMoney(stats.targets.achieved, 'Rs.')} Achieved</span>
                  <span>{formatMoney(stats.targets.total, 'Rs.')} Target</span>
               </div>
            </Card>


            {/* Attendance Progress */}
            <Card className="p-6 border-none shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="text-emerald-600"><CalendarDays className="h-6 w-6" /></div>
                  <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">Attendance Progress</h3>
               </div>
               <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-emerald-500 transition-all duration-1000 ease-out flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${stats.attendance.percent}%` }}>
                     {stats.attendance.percent}%
                  </div>
               </div>
               <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  <span>{stats.attendance.present} Days Present</span>
                  <span>{stats.attendance.totalDays} Working Days</span>
               </div>
            </Card>
         </div>

         {/* Upcoming Holidays */}
         <Card className="border-none shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Holidays</h3>
               </div>
               <button className="text-xs font-bold text-primary-600 hover:underline" onClick={() => navigate('/staff/holidays')}>View All</button>
            </div>
            <CardBody className="flex-1 space-y-5">
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
               {!data.upcomingHolidays.length && <p className="text-center text-sm text-slate-400 italic py-10">No upcoming holidays</p>}
            </CardBody>
            <button className="w-full p-4 text-xs font-bold text-primary-600 flex items-center justify-center gap-2 hover:bg-slate-50 border-t border-slate-50 transition-colors" onClick={() => navigate('/staff/holidays')}>
               View full holiday calendar <ChevronRight className="h-3 w-3" />
            </button>
         </Card>
      </div>

      {/* 5. Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Button className="h-16 rounded-2xl bg-primary-600 border-none shadow-lg shadow-primary-100 group" onClick={() => navigate('/staff/attendance')}>
            <div className="flex items-center justify-center gap-4 w-full">
               <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform"><Fingerprint className="h-6 w-6" /></div>
               <div className="text-left">
                  <p className="text-lg font-black leading-tight uppercase tracking-tight">Check-IN</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Start Your Day</p>
               </div>
            </div>
         </Button>
         <Button className="h-16 rounded-2xl bg-emerald-500 border-none shadow-lg shadow-emerald-100 group" onClick={() => navigate('/staff/attendance')}>
            <div className="flex items-center justify-center gap-4 w-full">
               <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform"><Fingerprint className="h-6 w-6" /></div>
               <div className="text-left">
                  <p className="text-lg font-black leading-tight uppercase tracking-tight">Check-OUT</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">End Your Day</p>
               </div>
            </div>
         </Button>
         <Button variant="outline" className="h-16 rounded-2xl border-2 border-indigo-100 bg-white hover:bg-indigo-50 shadow-sm group" onClick={() => navigate('/staff/leaves')}>
            <div className="flex items-center justify-between gap-4 w-full px-4">
               <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform"><CalendarOff className="h-6 w-6" /></div>
                  <div className="text-left">
                     <p className="text-lg font-black leading-tight text-slate-800 uppercase tracking-tight">Apply for Leave</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request Leave</p>
                  </div>
               </div>
               <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
         </Button>
      </div>

      {/* 6. Quote Footer with Mountain BG */}
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

    </div>
  );
}

function PieChartIcon(props) {
   return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
   );
}

