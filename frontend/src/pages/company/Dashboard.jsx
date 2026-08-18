import { useEffect, useState, useCallback } from 'react';
import { Users, CalendarOff, UserCheck } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Spinner } from '@/components/ui';

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
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold">{data.totalStaff}</p>
              <p className="text-sm text-slate-500">Total Staff</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600"><UserCheck className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold">{data.activeStaff}</p>
              <p className="text-sm text-slate-500">Active Now</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-orange-100 p-3 text-orange-600"><CalendarOff className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold">{data.pendingLeaves}</p>
              <p className="text-sm text-slate-500">Pending Leaves</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
