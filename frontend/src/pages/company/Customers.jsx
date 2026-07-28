import { useEffect, useState, useCallback } from 'react';
import { Search, User, Phone, MapPin, Hash, Briefcase, Filter, X } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Input, Select, Table, Spinner, Pagination, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function CompanyCustomers() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [townFilter, setTownFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    try {
      const { data } = await api.get('/staff', { params: { limit: 100 } });
      setStaff(data?.data?.items || []);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        search: search || undefined,
        town: townFilter || undefined,
        createdBy: staffFilter || undefined
      };
      const { data } = await api.get('/customers', { params });
      setData(data?.data || { items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, townFilter, staffFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStaff(); }, [loadStaff]);

  const clearFilters = () => {
    setSearch('');
    setTownFilter('');
    setStaffFilter('');
    setPage(1);
  };

  if (!data && loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Company Customer List</h1>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              label="Search"
              placeholder="Name, contact, owner..."
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Input
            label="Filter by Town"
            placeholder="e.g. Kathmandu"
            value={townFilter}
            onChange={(e) => { setTownFilter(e.target.value); setPage(1); }}
          />
          <Select
            label="Filter by Employee"
            value={staffFilter}
            onChange={(e) => { setStaffFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Employees' },
              ...staff.map(s => ({ value: s._id, label: s.name }))
            ]}
          />
          <Button variant="outline" onClick={clearFilters} className="w-full">
            <X className="h-4 w-4 mr-2" /> Clear Filters
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={['Customer Name', 'Town', 'Contact Info', 'Added By', 'Owner']}
          data={data?.items || []}
          renderRow={(c) => (
            <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
              <td className="table-td">
                <div className="font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {c.address || 'No address'}
                </div>
              </td>
              <td className="table-td">
                <Badge color="blue">{c.town || '—'}</Badge>
              </td>
              <td className="table-td">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.contactNumber || '—'}
                  </div>
                  {c.panVat && (
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3" /> PAN/VAT: {c.panVat}
                    </div>
                  )}
                </div>
              </td>
              <td className="table-td">
                <div className="flex items-center gap-2">
                   <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                     {(c.createdBy?.name || 'S')[0]}
                   </div>
                   <span className="text-sm font-medium">{c.createdBy?.name || 'System'}</span>
                </div>
              </td>
              <td className="table-td">
                <div className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-slate-400" /> {c.ownerName || '—'}
                </div>
              </td>
            </tr>
          )}
          mobileRender={(c) => (
            <div key={c._id} className="p-4 space-y-3 border-b dark:border-slate-800 last:border-0">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.town} {c.address && `· ${c.address}`}</p>
                  </div>
                  <Badge color="blue">{c.town || 'N/A'}</Badge>
               </div>
               <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.contactNumber || '—'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {c.ownerName || '—'}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 pt-1 text-slate-400 italic">
                    <Briefcase className="h-3 w-3" /> Added by: {c.createdBy?.name || 'System'}
                  </div>
               </div>
            </div>
          )}
        />
        <Pagination pagination={data?.pagination} onPage={setPage} />
      </Card>
    </div>
  );
}
