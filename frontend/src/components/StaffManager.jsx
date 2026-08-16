/**
 * Reusable employee CRUD table.
 */
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, FileDown, UserMinus, X, RefreshCw, Camera, User as UserIcon } from 'lucide-react';
import { api, downloadFile } from '@/api/client';
import { Card, Button, Input, Select, Modal, Table, Badge, Spinner, Pagination } from '@/components/ui';
import { formatMoney, cn, fixFileUrl } from '@/lib/utils';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const emptyForm = {
  name: '', email: '', phone: '', address: '', pan: '', position: '',
  basicSalary: 0, allowances: 0, role: 'STAFF', designation: '',
  workMode: 'OUTDOOR', branch: 'MAIN', shift: '',
  allowedMobileCount: 1, allowedWebCount: 1,
  profilePhoto: '',
};


export default function StaffManager({ mode = 'company', companyId = null, allowCompanySelection = false }) {
  const { requestCamera } = useAppPermissions();
  const [data, setData] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');

  useEffect(() => {
    if (companyId) setSelectedCompanyId(companyId);
  }, [companyId]);

  useEffect(() => {
    if (mode === 'company') {
      api.get('/company-config/designations').then(({ data }) => setDesignations(data.data)).catch(() => {});
      api.get('/company-config/branches').then(({ data }) => setBranches(data.data)).catch(() => {});
      api.get('/company-config/shifts').then(({ data }) => setShifts(data.data)).catch(() => {});
    }
    if (mode === 'system') {
      api.get('/designations').then(res => setDesignations(res.data.data));
    }
    if (!allowCompanySelection) return;
    (async () => {
      const { data: response } = await api.get('/companies', { params: { limit: 200 } });
      const items = response.data.items || [];
      setCompanies(items);
      if (!selectedCompanyId && items.length) setSelectedCompanyId(items[0]._id);
    })();
  }, [allowCompanySelection, selectedCompanyId, mode]);

  const load = useCallback(async () => {
    const params = { page, search: search || undefined };
    if (mode === 'system') params.scope = 'system';
    if (mode === 'company' && (companyId || selectedCompanyId)) params.companyId = companyId || selectedCompanyId;
    if (allowCompanySelection && !params.companyId) {
      setData({ items: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 1 } });
      return;
    }
    const { data } = await api.get('/staff', { params });
    setData(data.data);
  }, [page, search, mode, companyId, selectedCompanyId, allowCompanySelection]);

  useEffect(() => { load(); }, [load]);

  const handlePhotoUpload = async () => {
    const hasPermission = await requestCamera();
    if (!hasPermission) {
      alert('Camera/Media permission is required to update photo.');
      return;
    }

    try {
      const image = await CapCamera.getPhoto({
        quality: 60,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 600,
        height: 600
      });

      if (image && image.dataUrl) {
        setForm(prev => ({ ...prev, profilePhoto: image.dataUrl }));
      }
    } catch (e) {
      const msg = e.message?.toLowerCase() || '';
      if (!msg.includes('cancel') && !msg.includes('user closed')) {
        setError('Failed to process image: ' + (e.message || 'Unknown error'));
      }
    }
  };

  const submit = async (e) => {

    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = {
        ...form,
        basicSalary: mode === 'system' ? 0 : Number(form.basicSalary),
        allowances: mode === 'system' ? 0 : Number(form.allowances),
        role: mode === 'system' ? 'ADMIN_EMPLOYEE' : form.role,
        designation: form.designation || undefined,
        shift: form.shift || undefined,
        companyId: mode === 'company' ? (companyId || selectedCompanyId || undefined) : undefined,
        workMode: form.workMode,
        branch: form.workMode === 'INDOOR' ? (form.branch === 'MAIN' ? null : (form.branch || null)) : null,
        allowedMobileCount: Number(form.allowedMobileCount),
        allowedWebCount: Number(form.allowedWebCount),
      };
      if (editing) {
        delete body.email; delete body.role;
        // Don't resend old photo URL to save bandwidth
        if (body.profilePhoto === editing.profilePhoto) {
          delete body.profilePhoto;
        }
        await api.patch(`/staff/${editing._id}`, body);
      } else {

        await api.post('/staff', body);
      }
      setModal(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const deactivate = async (u) => {
    if (!confirm(`Deactivate ${u.name}?`)) return;
    await api.delete(`/staff/${u._id}`);
    load();
  };

  const authorizeReset = async (u) => {
    if (!confirm(`Authorize device reset for ${u.name}? They will be able to login from a new device once.`)) return;
    try {
      await api.patch(`/staff/${u._id}/authorize-device-reset`);
      alert(`Success: ${u.name} can now login from a new device.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Authorization failed');
    }
  };

  const hardDelete = async (u) => {
    if (!confirm(`PERMANENTLY DELETE ${u.name}? This cannot be undone.`)) return;
    await api.delete(`/staff/${u._id}/hard`);
    load();
  };

  if (!data) return <Spinner />;
  const companyOptions = companies.map((c) => ({ value: c._id, label: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{mode === 'system' ? 'System Employees' : 'Employee Management'}</h1>
        <Button className="w-full sm:w-auto" onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }} disabled={allowCompanySelection && !selectedCompanyId}>
          <Plus className="h-4 w-4 mr-2" /> Add Employee
        </Button>
      </div>

      {allowCompanySelection && (
        <Card>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Select
              label="Select Company"
              value={selectedCompanyId}
              onChange={(e) => { setSelectedCompanyId(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'Choose a company…' }, ...companyOptions]}
            />
            <p className="text-sm text-slate-500">Manage employees for the selected company.</p>
          </div>
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <Input placeholder="Search by name or email…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        </div>
        <Table
          columns={mode === 'system'
            ? ['Name', 'Contact', 'Designation', 'Status', 'Actions']
            : ['Name', 'Contact', 'Position', 'Designation', 'Salary', 'Status', 'Actions']
          }
          data={data.items}
          renderRow={(u) => (
            <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="table-td">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                    {u.name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[9px] uppercase font-bold text-primary-600 bg-primary-50 px-1 rounded">{u.workMode}</p>
                      {u.workMode === 'INDOOR' && (
                        <p className="text-[9px] text-slate-500 italic">
                           ({u.branch?.name || 'Main Office'})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="table-td">
                <p>{u.email}</p>
                <p className="text-xs text-slate-400">{u.phone || '—'}</p>
              </td>
              {mode === 'company' && <td className="table-td">{u.position || '—'}</td>}
              <td className="table-td">
                <Badge color="blue">{u.designation?.name || (mode === 'system' ? (u.subRole || 'ADMIN') : u.role.replace('COMPANY_', ''))}</Badge>
              </td>
              {mode === 'company' && (
                <td className="table-td">
                  <p>{formatMoney(u.basicSalary)}</p>
                  <p className="text-xs text-slate-400">+{formatMoney((u.allowances || 0) + (u.dailyAllowance || 0))}</p>
                </td>
              )}
              <td className="table-td">
                <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="table-td">
                <div className="flex gap-1">
                  <button className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit"
                    onClick={() => {
                      setEditing(u);
                      setForm({
                        ...emptyForm,
                        ...u,
                        designation: u.designation?._id || '',
                        branch: u.branch?._id || 'MAIN',
                        shift: u.shift?._id || '',
                        profilePhoto: u.profilePhoto || ''
                      });
                      setModal(true);
                    }}>
                    <Pencil className="h-4 w-4" />
                  </button>

                  {mode === 'company' && (
                    <button className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" title="Employee PDF"
                      onClick={() => downloadFile(`/reports/employee/${u._id}/pdf`, `employee-${u.name}.pdf`)}>
                      <FileDown className="h-4 w-4" />
                    </button>
                  )}
                  <button className="rounded p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Deactivate"
                    onClick={() => deactivate(u)}>
                    <UserMinus className="h-4 w-4" />
                  </button>
                  <button className="rounded p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Reset Device"
                    onClick={() => authorizeReset(u)}>
                    <RefreshCw className={cn("h-4 w-4", u.deviceResetRequested && "animate-spin")} />
                  </button>
                  <button className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" title="Permanent Delete"
                    onClick={() => hardDelete(u)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          mobileRender={(u) => (
            <div key={u._id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                    {u.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[9px] uppercase font-bold text-primary-600">{u.workMode}</p>
                      {u.workMode === 'INDOOR' && (
                        <p className="text-[9px] text-slate-500 italic">
                           ({u.branch?.name || 'Main Office'})
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{u.designation?.name || u.position || 'No Designation'}</p>
                  </div>
                </div>
                <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Contact</p>
                  <p className="truncate">{u.email}</p>
                  <p className="text-slate-500">{u.phone || '—'}</p>
                </div>
                {mode === 'company' && (
                  <div className="col-span-2 flex justify-between pt-1">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Basic Salary</p>
                      <p>{formatMoney(u.basicSalary)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Allowances</p>
                      <p>+{formatMoney((u.allowances || 0) + (u.dailyAllowance || 0))}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" className="justify-start px-2"
                  onClick={() => {
                    setEditing(u);
                    setForm({
                      ...emptyForm,
                      ...u,
                      designation: u.designation?._id || '',
                      branch: u.branch?._id || 'MAIN',
                      shift: u.shift?._id || '',
                      profilePhoto: u.profilePhoto || ''
                    });
                    setModal(true);
                  }}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>

                <Button variant="outline" size="sm" className="justify-start px-2 text-amber-600" onClick={() => deactivate(u)}>
                  <UserMinus className="h-3.5 w-3.5 mr-1.5" /> Deactivate
                </Button>
                <Button variant="outline" size="sm" className="justify-start px-2 text-blue-600" onClick={() => authorizeReset(u)}>
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5 shrink-0", u.deviceResetRequested && "animate-spin")} />
                  <span className="truncate text-[10px]">Reset Device</span>
                </Button>
                <Button variant="danger" size="sm" className="justify-start px-2" onClick={() => hardDelete(u)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          )}
        />
        <Pagination pagination={data.pagination} onPage={setPage} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit ${editing.name}` : `Add Employee`} wide>
        {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">{error}</div>}
        <form onSubmit={submit} className="space-y-8">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center gap-3 border-b pb-6">
            <div className="relative group">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-slate-100 bg-slate-50 shadow-sm dark:border-slate-800">
                {form.profilePhoto ? (
                  <img src={fixFileUrl(form.profilePhoto)} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <UserIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handlePhotoUpload}
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Photo</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

            <div className="space-y-4">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Basic Information</p>
               <Input label="Full Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
               <Input label="Email *" type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <Input label="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
               </div>
               <Input label="Position / Title" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
               <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="space-y-4">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Work & Permissions</p>
               <Select label="Designation *" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                options={[
                  { value: '', label: 'Select Designation…' },
                  ...designations.map(d => ({
                    value: d._id,
                    label: d.department?.name ? `${d.name} (${d.department.name})` : d.name
                  }))
                ]} />

               <div className="grid grid-cols-2 gap-4">
                  <Select label="Work Mode" value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                    options={[{ value: 'INDOOR', label: 'Indoor' }, { value: 'OUTDOOR', label: 'Outdoor' }]} />

                  <Select label="Shift *" required value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    options={[
                      { value: '', label: 'Select Shift…' },
                      ...shifts.map(s => ({ value: s._id, label: `${s.name}` }))
                    ]} />
               </div>

               {form.workMode === 'INDOOR' && (
                <Select label="Linked Office / Branch *" required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  options={[{ value: 'MAIN', label: 'Main Office' }, ...branches.map(b => ({ value: b._id, label: b.name }))]} />
               )}

               <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
                  <Input label="Mobile Devices" type="number" min="1" value={form.allowedMobileCount} onChange={(e) => setForm({ ...form, allowedMobileCount: e.target.value })} />
                  <Input label="Web Sessions" type="number" min="1" value={form.allowedWebCount} onChange={(e) => setForm({ ...form, allowedWebCount: e.target.value })} />
               </div>
            </div>

            <div className="sm:col-span-2 space-y-4">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Finance</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Basic Salary" type="number" min="0" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
                  <Input label="Monthly Allowances" type="number" min="0" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
               </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>Reset Form</Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => setModal(false)} className="px-6">Cancel</Button>
            <Button type="submit" loading={saving} className="px-8">{editing ? 'Save Changes' : 'Register Employee'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
