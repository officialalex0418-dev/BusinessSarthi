import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Input, Modal, Badge, Spinner, Table, Select } from '@/components/ui';

const PERMISSIONS = [
  { key: 'staff', label: 'Staff Management' },
  { key: 'liveTracking', label: 'Live Tracking' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leaves', label: 'Leaves' },
  { key: 'salesTracker', label: 'Sales Management' },
  { key: 'salesEntry', label: 'Sales Entry' },
  { key: 'customerMasterList', label: 'Customer Master List' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'distributors', label: 'Distributors' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'reports', label: 'Reports' },
  { key: 'configuration', label: 'Configuration' },
];

const emptyForm = {
  name: '',
  department: '',
  baseRole: 'STAFF',
  permissions: PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {}),
};

export default function Designations() {
  const [items, setItems] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [desigRes, deptRes] = await Promise.all([
      api.get('/company-config/designations'),
      api.get('/company-config/departments')
    ]);
    setItems(desigRes.data.data);
    setDepartments(deptRes.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.patch(`/company-config/designations/${editing._id}`, form);
      else await api.post('/company-config/designations', form);
      setModal(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!confirm(`Delete designation "${item.name}"?`)) return;
    await api.delete(`/company-config/designations/${item._id}`);
    load();
  };

  if (!items) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Designations</h1>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> New Designation
        </Button>
      </div>

      <Card>
        <Table
          columns={['Designation', 'Department', 'Permissions', 'Actions']}
          data={items}
          renderRow={(item) => (
            <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="table-td font-bold">{item.name}</td>
              <td className="table-td text-slate-500 font-medium">{item.department?.name || '—'}</td>
              <td className="table-td">
                <div className="flex flex-wrap gap-1">
                  {PERMISSIONS.map(p => item.permissions[p.key] && (
                    <Badge key={p.key} color="blue" className="text-[9px] uppercase tracking-tighter">
                      {p.label}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="table-td">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditing(item);
                    setForm({
                      ...item,
                      department: item.department?._id || item.department || ''
                    });
                    setModal(true);
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => remove(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          )}
          mobileRender={(item) => (
            <div key={item._id} className="p-4 space-y-3 border-b dark:border-slate-800 last:border-0">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{item.department?.name || 'No Department'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => {
                      setEditing(item);
                      setForm({ ...item, department: item.department?._id || item.department || '' });
                      setModal(true);
                    }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
               </div>
               <div className="flex flex-wrap gap-1">
                  {PERMISSIONS.filter(p => item.permissions[p.key]).map(p => (
                    <Badge key={p.key} color="blue" className="text-[8px] uppercase px-1.5 py-0">
                      {p.label}
                    </Badge>
                  ))}
                  {PERMISSIONS.filter(p => item.permissions[p.key]).length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No permissions assigned</p>
                  )}
               </div>
            </div>
          )}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit ${editing.name}` : 'New Designation'} wide>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Designation Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Manager" />
            <Select
              label="Department *"
              required
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              options={[
                { value: '', label: 'Select Department...' },
                ...departments.map(d => ({ value: d._id, label: d.name }))
              ]}
            />
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Access Permissions</p>
            <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 lg:grid-cols-3">
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 transition-colors">
                  <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={form.permissions[p.key]}
                    onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [p.key]: e.target.checked } })} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
