import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Globe, ExternalLink, Image as ImageIcon, Video, Eye } from 'lucide-react';
import { api } from '@/api/client';
import {
  Card, Button, Input, Select, Modal, Table, Badge, Spinner, Pagination, Textarea
} from '@/components/ui';
import { cn } from '@/lib/utils';

const emptyForm = {
  name: '',
  description: '',
  mediaType: 'image',
  media: '',
  url: '',
  isActive: true,
  displayOrder: 0
};

export default function Products() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/products', { params: { page, search: search || undefined } });
    setData(data.data);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) };
      if (editing) await api.patch(`/admin/products/${editing._id}`, payload);
      else await api.post('/admin/products', payload);
      setModal(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Are you sure you want to permanently remove product "${p.name}"?`)) return;
    try {
      await api.delete(`/admin/products/${p._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleStatus = async (p) => {
    try {
      await api.patch(`/admin/products/${p._id}`, { isActive: !p.isActive });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Toggle failed');
    }
  };

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
           <h1 className="text-2xl font-bold">RCS Products</h1>
           <p className="text-sm text-slate-500">Manage products displayed in the Business Sarthi website footer.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setModal(true); }}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <Input placeholder="Search products…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        </div>
        <Table
          columns={['Media', 'Product Name', 'Description', 'URL', 'Order', 'Status', 'Actions']}
          data={data.items}
          renderRow={(p) => (
            <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="table-td">
                <div className="h-12 w-20 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                   {p.mediaType === 'image' ? (
                     <img src={p.mediaUrl} alt={p.name} className="h-full w-full object-cover" />
                   ) : (
                     <div className="flex h-full w-full items-center justify-center bg-slate-900">
                        <Video className="h-5 w-5 text-white" />
                     </div>
                   )}
                </div>
              </td>
              <td className="table-td font-bold">{p.name}</td>
              <td className="table-td max-w-xs truncate">{p.description}</td>
              <td className="table-td">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                  Link <ExternalLink className="h-3 w-3" />
                </a>
              </td>
              <td className="table-td text-center">{p.displayOrder}</td>
              <td className="table-td">
                <button onClick={() => toggleStatus(p)}>
                   <Badge color={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                </button>
              </td>
              <td className="table-td text-right">
                <div className="flex justify-end gap-1">
                  <button title="Edit" className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      setEditing(p);
                      setForm({
                        name: p.name,
                        description: p.description,
                        mediaType: p.mediaType,
                        media: p.mediaUrl, // Keep existing URL unless replaced
                        url: p.url,
                        isActive: p.isActive,
                        displayOrder: p.displayOrder
                      });
                      setModal(true);
                    }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button title="Delete" className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => remove(p)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
        <Pagination pagination={data.pagination} onPage={setPage} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit ${editing.name}` : 'Add New Product'} wide>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          <div className="lg:col-span-8 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Product Name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <Input label="Product URL *" type="url" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
             </div>

             <Textarea label="Short Description *" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} maxLength={300} />

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Media Type" value={form.mediaType} onChange={e => setForm({...form, mediaType: e.target.value})}
                  options={[{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }]} />
                <Input label="Display Order" type="number" value={form.displayOrder} onChange={e => setForm({...form, displayOrder: e.target.value})} />
             </div>

             <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="h-4 w-4 rounded accent-primary-600" />
                <label htmlFor="isActive" className="text-sm font-medium">Show in website footer</label>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium">Media Upload (Image/Video) *</label>
                <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 p-6 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                   <div className="flex justify-center">
                      {form.mediaType === 'image' ? (
                        <div className="h-40 w-64 overflow-hidden rounded-lg border bg-white flex items-center justify-center">
                           {form.media ? <img src={form.media} className="h-full w-full object-contain" /> : <ImageIcon className="h-10 w-10 text-slate-300" />}
                        </div>
                      ) : (
                        <div className="h-40 w-64 overflow-hidden rounded-lg border bg-slate-900 flex items-center justify-center text-white">
                           {form.media && form.media.startsWith('http') ? (
                              <video src={form.media} muted className="h-full w-full" />
                           ) : form.media ? (
                              <div className="text-xs text-emerald-400">New Video Selected</div>
                           ) : (
                              <Video className="h-10 w-10 text-slate-700" />
                           )}
                        </div>
                      )}
                   </div>
                   <div className="flex justify-center">
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('media-input').click()}>
                         {form.media ? 'Replace Media' : 'Upload Media'}
                      </Button>
                      <input id="media-input" className="hidden" type="file"
                        accept={form.mediaType === 'image' ? 'image/*' : 'video/*'}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Limit file size (5MB for images, 20MB for videos)
                          const maxSize = form.mediaType === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
                          if (file.size > maxSize) {
                             alert(`File too large. Max ${form.mediaType === 'image' ? '5MB' : '20MB'} allowed.`);
                             return;
                          }

                          const reader = new FileReader();
                          reader.onload = () => setForm({ ...form, media: reader.result });
                          reader.readAsDataURL(file);
                        }} />
                   </div>
                   <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest">
                      {form.mediaType === 'image' ? 'PNG, JPG, WEBP (Max 5MB)' : 'MP4, WEBM (Max 20MB)'}
                   </p>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-4 pt-4 lg:pt-0 lg:border-l border-slate-100 lg:pl-6">
             <div className="sticky top-0">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Footer Preview</p>
                <div className="rounded-2xl border border-slate-100 bg-slate-900 p-5 shadow-2xl overflow-hidden relative group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/10 rounded-full blur-2xl" />

                   <div className="aspect-video w-full rounded-xl bg-slate-800 border border-white/5 overflow-hidden mb-4 shadow-lg flex items-center justify-center">
                      {form.mediaType === 'image' ? (
                        form.media ? <img src={form.media} className="h-full w-full object-cover" /> : <div className="h-4 w-12 bg-white/10 rounded-full animate-pulse" />
                      ) : (
                        <div className="flex items-center justify-center bg-slate-900 w-full h-full"><Video className="h-6 w-6 text-white/20" /></div>
                      )}
                   </div>

                   <h4 className="text-white font-bold text-sm mb-1">{form.name || 'Product Name'}</h4>
                   <p className="text-slate-400 text-[11px] leading-relaxed mb-4 line-clamp-2">{form.description || 'Short product description goes here...'}</p>

                   <div className="inline-flex items-center gap-2 text-primary-400 text-[10px] font-black uppercase tracking-widest border-b border-primary-400/30 pb-0.5">
                      Explore Product →
                   </div>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-2 lg:col-span-12 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
