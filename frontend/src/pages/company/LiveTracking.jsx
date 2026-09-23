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
      return [...others, {
        ...p,
        name: p.name || p.staffName,
        designation: p.designation || p.position || 'Staff',
        profilePhoto: p.profilePhoto
      }];
    });
  }, []));

  const activeMarkers = useMemo(() => markers || [], [markers]);

  const loadRoute = async () => {
    if (!selectedStaff) return;
    const { data } = await api.get(`/locations/history/${selectedStaff}?period=${period}`);
    setRouteData({
      points: data.data.points,
      attendance: data.data.attendance || [],
      packageInterval: data.data.packageInterval || 60
    });
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

  const handleStaffFocus = (staffId) => {
    // If clicking same staff, temporarily unset and set back to trigger useEffect in MapEffects
    if (focusedStaffId === staffId) {
      setFocusedStaffId(null);
      setTimeout(() => setFocusedStaffId(staffId), 10);
    } else {
      setFocusedStaffId(staffId);
    }
  };

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
                onMarkerClick={(m) => handleStaffFocus(m.staffId)}
              />
          </div>
          <Card>
            <CardHeader
              title={refreshing ? "Refreshing Staff..." : `Active Staff (${activeMarkers.length})`}
              action={<Button variant="ghost" onClick={handleManualRefresh} disabled={refreshing} title="Trigger direct location ping to employee devices">
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>}
            />
            <CardBody className="max-h-[420px] space-y-3 overflow-y-auto text-slate-900 dark:text-slate-100">
              {activeMarkers.length === 0 && <p className="text-sm text-slate-400">No active staff currently checked in.</p>}
              {activeMarkers.map((m) => (
                <div
                  key={m.staffId}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    focusedStaffId === m.staffId
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                  }`}
                  onClick={() => handleStaffFocus(m.staffId)}
                >
                  <div className="flex items-center gap-3">
                    {/* 1. Employee Profile Picture */}
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      {m.profilePhoto ? (
                        <img src={fixFileUrl(m.profilePhoto)} alt={m.name || 'Staff'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                          {(m.name || '?').slice(0, 1)}
                        </div>
                      )}
                    </div>

                    {/* 2. Employee Name & 3. Employee Designation */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{m.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {m.designation || m.position || 'Staff'}
                      </p>
                    </div>

                    {/* 4. Battery Percentage */}
                    <div className="flex items-center gap-1">
                      {m.batteryLevel != null && (
                        <div className={cn(
                          "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border",
                          m.batteryLevel > 20
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 animate-pulse"
                        )}>
                          <span>{m.batteryLevel}%</span>
                        </div>
                      )}
                    </div>
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
