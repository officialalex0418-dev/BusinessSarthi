import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapPin, Route, Flame, RefreshCw } from 'lucide-react';
import { api } from '@/api/client';
import { useSocketEvent } from '@/context/SocketContext';
import { Card, CardHeader, CardBody, Button, Select, Spinner, Badge } from '@/components/ui';
import LiveMap from '@/components/LiveMap';
import { formatDateTime, fixFileUrl, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function LiveTracking() {
  const { user } = useAuth();
  const dateFormat = user?.company?.settings?.dateFormat || 'BS';
  const [tab, setTab] = useState('live'); // live | route | heatmap
  const [markers, setMarkers] = useState([]);
  const [focusedStaffId, setFocusedStaffId] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [routeData, setRouteData] = useState({ points: [], attendance: [], packageInterval: 60 });
  const [analysis, setAnalysis] = useState(null);
  const [heat, setHeat] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [refreshing, setRefreshing] = useState(false);

  const getRelativeTime = (date) => {
    if (!date) return 'Waiting for signal';
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return 'Active now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return formatDateTime(date, dateFormat);
  };

  const getStatusInfo = (item) => {
    // Show 'REFRESH PENDING' if a refresh was requested in the last 20 seconds and we're still waiting for a fresh ping
    const isPending = item.lastRefreshRequestedAt &&
      (new Date() - new Date(item.lastRefreshRequestedAt)) < 20000 &&
      (!item.recordedAt || new Date(item.recordedAt) < new Date(item.lastRefreshRequestedAt));

    if (isPending) {
       return { label: 'REFRESH PENDING', color: 'bg-indigo-50 text-indigo-600 animate-pulse' };
    }

    const status = item.locationStatus || 'STALE';
    const colors = {
      'LIVE': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
      'ON_SCHEDULE': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      'DELAYED': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      'STALE': 'bg-slate-100 text-slate-500 dark:bg-slate-800'
    };
    return { label: status.replace('_', ' '), color: colors[status] || colors.STALE };
  };

  const loadLive = useCallback(async () => {
    const { data } = await api.get('/locations/live');
    setMarkers(data.data.items || []);
  }, []);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
       // 1. Fetch latest from server
       await loadLive();
       // 2. Broadcast refresh request to phones
       await api.post('/locations/request-refresh');
       // Turn off loading after 8s (enough time for most sockets to respond)
       setTimeout(() => setRefreshing(false), 8000);
    } catch (err) {
       console.error('Refresh request failed', err);
       setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLive();
    // Instant Live Refresh on mount (Requirement 3)
    api.post('/locations/request-refresh').catch(() => {});

    // Smart Polling: Fallback to REST only if socket is disconnected.
    const interval = setInterval(loadLive, 300000);
    return () => clearInterval(interval);
  }, [loadLive]);
  useEffect(() => {
    api.get('/staff?limit=100').then(({ data }) =>
      setStaffList(data.data.items.filter((u) => ['STAFF', 'COMPANY_MANAGER'].includes(u.role))));
  }, []);

  // realtime marker updates
  useSocketEvent('location:update', useCallback((p) => {
    setMarkers((prev) => {
      if (!prev) return prev;
      const others = prev.filter((m) => m.staffId !== p.staffId);
      return [...others, { ...p, name: p.staffName, profilePhoto: p.profilePhoto }];
    });
  }, []));

  const activeMarkers = useMemo(() => markers || [], [markers]);

  const loadRoute = async () => {
    if (!selectedStaff) return;
    const [r, a] = await Promise.all([
      api.get(`/locations/history/${selectedStaff}?period=${period}`),
      api.get(`/locations/analysis/${selectedStaff}?period=${period}`),
    ]);
    setRouteData({
      points: r.data.data.points,
      attendance: r.data.data.attendance || [],
      packageInterval: r.data.data.packageInterval || 60
    });
    setAnalysis(a.data.data);
  };

  const loadHeat = async () => {
    const { data } = await api.get(`/locations/heatmap?period=${period}&staffId=${selectedStaff}`);
    setHeat(data.data.points);
  };

  const periodOptions = [
    { value: 'daily', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'weekly', label: 'Last 7 days' },
    { value: 'monthly', label: 'Last 30 days' },
  ];

  if (!markers) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Employee Tracking</h1>
        <div className="flex w-full gap-1 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {[
            ['live', 'Live', MapPin],
            ['route', 'Route', Route],
            ['heatmap', 'Heatmap', Flame],
          ].map(([key, label, Icon]) => (
            <Button key={key} variant={tab === key ? 'primary' : 'outline'} size="sm" className="whitespace-nowrap" onClick={() => { setTab(key); setPeriod('daily'); }}>
              <Icon className="h-4 w-4" /> {label}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'live' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
              <LiveMap
                markers={activeMarkers}
                focusedId={focusedStaffId}
                onMarkerClick={(m) => setFocusedStaffId(m.staffId)}
              />
          </div>
          <Card>
            <CardHeader
              title={refreshing ? "Refreshing Staff..." : `Active Staff (${activeMarkers.length})`}
              action={<Button variant="ghost" onClick={handleManualRefresh} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>}
            />
            <CardBody className="max-h-[420px] space-y-3 overflow-y-auto">
              {activeMarkers.length === 0 && <p className="text-sm text-slate-400">No location pings in the last 24h.</p>}
              {activeMarkers.map((m) => (
                <div
                  key={m.staffId}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    focusedStaffId === m.staffId
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                  }`}
                  onClick={() => setFocusedStaffId(m.staffId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      {m.profilePhoto ? <img src={fixFileUrl(m.profilePhoto)} alt={m.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">{(m.name || '?').slice(0, 1)}</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{m.position || 'Staff'}</p>
                    </div>
                    {m.batteryLevel != null && <Badge color={m.batteryLevel > 20 ? 'green' : 'red'}>🔋 {m.batteryLevel}%</Badge>}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {m.lat != null ? `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}` : 'No GPS data'}
                      </p>
                      {m.accuracy != null && <p className="text-[9px] text-slate-500">Acc: ±{Math.round(m.accuracy)}m</p>}
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                      getStatusInfo(m).color
                    )}>
                      {getStatusInfo(m).label} • {getRelativeTime(m.recordedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'route' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Select label="Staff" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}
                options={[{ value: '', label: 'Select staff…' }, ...staffList.map((s) => ({ value: s._id, label: s.name }))]} className="w-56" />
              <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}
                options={periodOptions} className="w-44" />
              <Button onClick={loadRoute} disabled={!selectedStaff}>Load Route</Button>
            </div>
            {analysis && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                  <p className="text-xl font-bold">{analysis.distanceKm} km</p>
                  <p className="text-xs text-slate-500">Distance</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                  <p className="text-xl font-bold">{analysis.totalPings}</p>
                  <p className="text-xs text-slate-500">Pings</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                  <p className="text-sm font-bold">{analysis.firstPing ? new Date(analysis.firstPing).toLocaleTimeString() : '—'}</p>
                  <p className="text-xs text-slate-500">First Ping</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                  <p className="text-sm font-bold">{analysis.lastPing ? new Date(analysis.lastPing).toLocaleTimeString() : '—'}</p>
                  <p className="text-xs text-slate-500">Last Ping</p>
                </div>
              </div>
            )}
          </Card>
          <LiveMap
            route={routeData.points}
            attendance={routeData.attendance}
            markerInterval={routeData.packageInterval}
          />
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Select label="Staff (Optional)" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}
                options={[{ value: '', label: 'All Staff' }, ...staffList.map((s) => ({ value: s._id, label: s.name }))]} className="w-56" />
              <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}
                options={periodOptions} className="w-44" />
              <Button onClick={loadHeat}>Load Heatmap</Button>
              <p className="pb-2 text-xs text-slate-400">{heat.length} sampled movement points</p>
            </div>
          </Card>
          <LiveMap heatPoints={heat} />
        </div>
      )}
    </div>
  );
}
