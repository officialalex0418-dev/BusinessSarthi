import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarOff, Target, Clock as ClockIcon, MapPin, AlertTriangle, MessageSquare, Mail, Phone, Building2, Calendar, Fingerprint } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { api } from '@/api/client';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Device } from '@capacitor/device';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { Card, CardHeader, CardBody, Spinner, Badge, Button, EmptyState } from '@/components/ui';
import { formatMoney, formatTime, formatDate, cn, fixFileUrl } from '@/lib/utils';
import { adToBs } from '@/lib/nepaliDate';
import { t } from '@/lib/i18n';
import LiveClock from '@/components/Clock';

function ProgressRing({ value, color, label, sub }) {
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={140} height={140}>
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" fill={color} cornerRadius={8} background={{ fill: '#e2e8f0' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="-mt-[88px] text-2xl font-bold">{value}%</p>
      <p className="mt-[52px] text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // APP LOGIC: Only track if checked in AND not checked out (Requirement 3)
  const isTrackingNeeded = data ? (data.checkInStatus && !data.checkOutStatus) : false;
  const { status: trackingStatus, intervalMinutes, lastPing } = useLocationTracker(isTrackingNeeded);

  const dateFormat = user?.company?.settings?.dateFormat || 'BS';

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

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioActive, setBioActive] = useState(localStorage.getItem(`biometric_${user?._id}`) === 'true');

  useEffect(() => {
    (async () => {
      try {
        const info = await Device.getInfo();
        if (info.platform === 'android' || info.platform === 'ios') {
          const res = await NativeBiometric.isAvailable();
          setBioAvailable(res.isAvailable);
        } else if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBioAvailable(available);
        }
      } catch (e) {
        console.warn('Biometric availability check failed', e);
      }
    })();
  }, [user?._id]);

  const toggleBiometric = async () => {
    if (!bioActive) {
      try {
        const info = await Device.getInfo();
        if (info.platform === 'android' || info.platform === 'ios') {
          await NativeBiometric.verifyIdentity({
            reason: "Enable biometric for attendance",
            title: "Verify Identity",
          });
        } else if (window.PublicKeyCredential) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "Business Sarthi" },
              user: { id: Uint8Array.from(user._id || 'user', c => c.charCodeAt(0)), name: user.email, displayName: user.name },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
              authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
              timeout: 60000
            }
          });
        }
        localStorage.setItem(`biometric_${user?._id}`, 'true');
        setBioActive(true);
      } catch (e) {
        console.error('Biometric verification failed', e);
      }
    } else {
      localStorage.removeItem(`biometric_${user?._id}`);
      setBioActive(false);
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

  if (!data) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Welcome, {data.profile.name}</h1>
              <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-primary-50">
                {data.profile.position} · {data.profile.company}
              </p>
            </div>
            <div className="mt-6 flex flex-1 justify-center sm:mt-0 sm:justify-end">
              <LiveClock />
            </div>
          </div>
        </div>
        <CardBody className="grid grid-cols-2 gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="text-center p-1">
            <p className="font-bold text-sm sm:text-base">{data.leaveBalance?.paid ?? 0} / {data.leaveBalance?.sick ?? 0}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter sm:tracking-normal">Paid / Sick Leaves</p>
          </div>
          <div className="text-center p-1">
            <Badge color="green">Shift Active</Badge>
            <p className="mt-1 text-[10px] text-slate-400 uppercase">Status</p>
          </div>
        </CardBody>
      </Card>

      {/* Tracking status */}
      <Card className="p-4">
        <div className="flex items-center gap-3 text-sm">
          {trackingStatus === 'active' ? (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium">{t('Location tracking active', language)}</p>
                <p className="text-xs text-slate-400">
                  Pinging every {intervalMinutes} min{lastPing ? ` · last ping ${formatTime(lastPing)}` : ''}
                </p>
              </div>
            </>
          ) : trackingStatus === 'denied' ? (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <p className="font-medium">Location permission denied — enable it in browser settings.</p>
            </>
          ) : (
            <p className="text-slate-400">Location tracking inactive (not in your company package or initializing…)</p>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button className="h-14" onClick={() => navigate('/staff/attendance')}>
          <ClockIcon className="h-5 w-5" /> Attendance
        </Button>
        <Button variant="outline" className="h-14" onClick={() => navigate('/staff/leaves')}>
          <CalendarOff className="h-5 w-5" /> Leave
        </Button>
      </div>
    </div>
  );
}

