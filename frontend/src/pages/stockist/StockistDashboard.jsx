import { useEffect, useState } from 'react';
import { Store, Building2, User, Phone, Mail, FileText, MapPin, Package, ShieldCheck } from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, Spinner, Badge } from '@/components/ui';

export default function StockistDashboard() {
  const { user } = useAuth();
  const [stockist, setStockist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stockists/me')
      .then(({ data }) => setStockist(data.data.stockist))
      .catch((err) => console.error('Failed to load stockist profile:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Store className="h-7 w-7 text-blue-200" />
            <h1 className="text-2xl font-bold">{stockist?.name || 'Stockist Panel'}</h1>
          </div>
          <p className="text-blue-100">Welcome to your Stockist Management Portal, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={stockist?.status === 'ACTIVE' ? 'green' : 'red'} className="text-sm px-3 py-1 bg-white/20 text-white border-0">
            {stockist?.status || 'ACTIVE'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Stockist Details</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PAN / VAT:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.panVat || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reg. Number:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.registrationNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.phone || '—'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Account Owner</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Name:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{user?.name || stockist?.owner?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Email:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email || stockist?.owner?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">Stockist Admin</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Package className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Subscription & Package</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Package:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.package?.name || 'Standard Plan'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Geofence Radius:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.checkInRadiusMeters || 100}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timezone:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{stockist?.settings?.timezone || 'Asia/Kathmandu'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
