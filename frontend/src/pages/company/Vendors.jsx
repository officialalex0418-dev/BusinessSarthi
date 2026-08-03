import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Truck, History, MapPin } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Input, Modal, Table, Spinner, Pagination, EmptyState, Badge } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

const emptyForm = { name: '', phone: '', email: '', address: '', panVat: '' };

export default function Vendors() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [featureBlocked, setFeatureBlocked] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/vendors', { params: { page, search: search || undefined } });
      setData(data.data);
    } catch (err) {
      if (err.response?.status === 403) setFeatureBlocked(true);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) await api.patch(`/vendors/${editing._id}`, form);
      else await api.post('/vendors', form);
      setModal(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const remove = async (v) => {
    if (!confirm(`Remove vendor ${v.name}?`)) return;
    await api.delete(`/vendors/${v._id}`);
    load();
  };

  if (featureBlocked) {
    return <Card><EmptyState icon={Truck} title="Vendor management not included in your package"
      subtitle="Upgrade your package to unlock vendor management." /></Card>;
  }
  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <Input placeholder="Search vendors…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        </div>
        <Table
          columns={['Vendor', 'Contact', 'Address', 'PAN/VAT', 'Payable Balance', 'Actions']}
          data={data.items}
          renderRow={(v) => (
            <tr key={v._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm">
              <td className="table-td font-medium text-primary-600">
                <Link to={`${v._id}`} className="hover:underline">{v.name}</Link>
              </td>
              <td className="table-td text-xs">
                <p>{v.phone || '—'}</p>
                <p className="text-slate-400">{v.email || ''}</p>
              </td>
              <td className="table-td text-xs truncate max-w-[150px]">{v.address || '—'}</td>
              <td className="table-td text-xs">{v.panVat || '—'}</td>
              <td className="table-td font-bold text-red-600">{formatMoney(v.outstandingBalance)}</td>
              <td className="table-td">
                <div className="flex gap-1">
                  <Link to={`${v._id}`} title="Ledger & Details" className="rounded p-1.5 text-slate-600 hover:bg-slate-100">
                    <History className="h-4 w-4" />
                  </Link>
                  <button className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setEditing(v); setForm({ ...emptyForm, ...v }); setModal(true); }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => remove(v)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          mobileRender={(v) => (
            <div key={v._id} className="p-4 space-y-3 border-b dark:border-slate-800 last:border-0 transition active:bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link to={`${v._id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 block truncate">{v.name}</Link>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{v.phone || 'No phone'}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payable</p>
                  <p className="font-black text-red-600 text-sm">{formatMoney(v.outstandingBalance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{v.address || 'Address not set'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <Link to={`${v._id}`} className="btn-outline h-9 text-xs flex items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm active:scale-95 transition-all">
                    <History className="h-3.5 w-3.5 mr-1" /> Ledger
                  </Link>
                  <Button variant="outline" className="h-9 shadow-sm active:scale-95 transition-all" onClick={() => { setEditing(v); setForm({ ...emptyForm, ...v }); setModal(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="danger" className="h-9 shadow-sm active:scale-95 transition-all" onClick={() => remove(v)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
              </div>
            </div>
          )}
        />
        <Pagination pagination={data.pagination} onPage={setPage} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'}>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Input label="Vendor Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="PAN / VAT" value={form.panVat} onChange={(e) => setForm({ ...form, panVat: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
