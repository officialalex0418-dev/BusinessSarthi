import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, TrendingUp, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { api } from '@/api/client';
import { Card, CardHeader, Button, Input, Textarea, Modal, Table, Spinner, EmptyState, Select } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const emptyRow = { productId: '', productName: '', quantity: 1, sellingPrice: 0, amount: 0 };

export default function StaffSales() {
  const { user } = useAuth();
  const dateFormat = user?.company?.settings?.dateFormat || 'BS';
  const [sales, setSales] = useState(null);
  const [summary, setSummary] = useState(null);
  const [metadata, setMetadata] = useState({ products: [], customers: [] });
  const [modal, setModal] = useState(false);
  const [custModal, setCustModal] = useState(false);

  const [items, setItems] = useState([{ ...emptyRow }]);
  const [customerName, setCustomerName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [custForm, setCustForm] = useState({ name: '', address: '', contactNumber: '', panVat: '', ownerName: '' });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [featureBlocked, setFeatureBlocked] = useState(false);
  const [period, setPeriod] = useState('monthly');

  const periodOptions = [
    { value: 'monthly', label: 'This Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
  ];

  const loadMetadata = useCallback(async () => {
    try {
      const { data } = await api.get('/sales/metadata');
      setMetadata(data.data);
    } catch (err) {}
  }, []);

  const load = useCallback(async () => {
    try {
      const [s, sum] = await Promise.all([
        api.get('/sales', { params: { period } }),
        api.get('/sales/me/summary')
      ]);
      setSales(s.data.data);
      setSummary(sum.data.data);
      loadMetadata();
    } catch (err) {
      if (err.response?.status === 403) {
        if (err.response?.data?.message?.toLowerCase().includes('package')) {
          setFeatureBlocked(true);
        } else {
          setLoadError(err.response?.data?.message || 'Access denied');
        }
      } else {
        setLoadError('Failed to load sales data');
      }
    }
  }, [loadMetadata, period]);

  useEffect(() => { load(); }, [load]);


  const addRow = () => setItems([...items, { ...emptyRow }]);

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;

    if (field === 'productId') {
      const prod = metadata.products.find(p => p._id === value);
      if (prod) {
        next[index].productName = prod.productName;
        next[index].sellingPrice = prod.sellingPrice;
      }
    }

    if (field === 'productId' || field === 'quantity' || field === 'sellingPrice') {
        next[index].amount = (Number(next[index].quantity) || 0) * (Number(next[index].sellingPrice) || 0);
    }

    setItems(next);
  };

  const startEdit = (sale) => {
    setEditingId(sale._id);
    setItems([{
        productId: sale.product || '',
        productName: sale.productName,
        quantity: sale.quantity,
        sellingPrice: sale.amount / sale.quantity,
        amount: sale.amount
    }]);
    setCustomerName(sale.customerName || '');
    setRemarks(sale.remarks || '');
    setModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setItems([{ ...emptyRow }]);
    setCustomerName('');
    setRemarks('');
    setSubmitError('');
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  const submit = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.productId && !i.productName)) {
        setSubmitError('Please select a product for all rows');
        return;
    }
    setSaving(true); setSubmitError('');
    try {
      if (editingId) {
          const item = items[0];
          await api.patch(`/sales/${editingId}`, {
              productId: item.productId,
              quantity: item.quantity,
              amount: item.amount,
              customerName,
              remarks,
          });
      } else {
          await api.post('/sales', {
            items,
            customerName,
            remarks,
          });
      }
      setModal(false);
      resetForm();
      load();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.toLowerCase().includes('package')) {
        setFeatureBlocked(true);
      }
      setSubmitError(err.response?.data?.message || 'Submission failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales record?')) return;
    try {
        await api.delete(`/sales/${id}`);
        load();
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete sale');
    }
  };

  const submitQuickCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', custForm);
      setCustModal(false);
      setCustomerName(custForm.name);
      setCustForm({ name: '', address: '', contactNumber: '', panVat: '', ownerName: '' });
      loadMetadata();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add customer');
    } finally { setSaving(false); }
  };

  if (featureBlocked) {
    return <Card><EmptyState icon={TrendingUp} title="Sales tracking is not enabled for your company"
      subtitle="Ask your company owner to upgrade the package." /></Card>;
  }

  if (loadError) {
    return (
      <Card className="p-8 text-center space-y-4">
        <p className="text-red-600 font-medium">{loadError}</p>
        <Button onClick={() => { setLoadError(''); load(); }} variant="outline">Try Again</Button>
      </Card>
    );
  }

  if (!sales || !summary) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Sales Entry</h1>
        <Button onClick={() => { resetForm(); setModal(true); }} className="h-11 px-6 rounded-xl shadow-lg shadow-primary-100">
           <Plus className="h-5 w-5 mr-2" /> New Sale
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatMoney(summary.monthlyTarget)}</p>
          <p className="text-[10px] font-medium text-slate-400">Monthly goal</p>
        </Card>

        <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achieved</p>
          <p className="text-2xl font-black text-emerald-600">{formatMoney(summary.achieved)}</p>
          <p className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">({summary.progressPct}%)</p>
        </Card>

        <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
          <p className="text-2xl font-black text-orange-500">{formatMoney(summary.remaining)}</p>
          <p className="text-[10px] font-medium text-slate-400">to meet target</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-b border-slate-50 dark:border-slate-800">
           <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                My Sales — {periodOptions.find(o => o.value === period)?.label}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{summary.salesCount} total entries in this view</p>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400">Filter By:</span>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                options={periodOptions}
                className="w-40 h-10 rounded-xl"
              />
           </div>
        </div>

        <Table
          columns={['Date', 'Product', 'Qty', 'Amount', 'Customer', 'Actions']}
          data={sales.items}

          renderRow={(s) => (
            <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="table-td text-slate-500 font-medium">{formatDate(s.saleDate, dateFormat)}</td>
              <td className="table-td font-bold text-slate-800 dark:text-slate-200">{s.productName}</td>
              <td className="table-td">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-tight">{s.quantity}</span>
              </td>
              <td className="table-td font-black text-slate-900 dark:text-white">{formatMoney(s.amount)}</td>
              <td className="table-td text-slate-500 text-xs font-semibold">{s.customerName || '—'}</td>
              <td className="table-td">
                <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} title="Edit Entry" className="p-2 text-slate-400 hover:text-primary-600 transition-all hover:bg-primary-50 rounded-xl">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(s._id)} title="Delete Entry" className="p-2 text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </td>
            </tr>
          )}

          mobileRender={(s) => (
            <div key={s._id} className="p-4 space-y-2 border-b last:border-0 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="font-medium">{s.productName}</p>
                <p className="font-bold text-primary-600">{formatMoney(s.amount)}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="space-y-1">
                    <p>{formatDate(s.saleDate, dateFormat)} · Qty: {s.quantity}</p>
                    <p className="truncate max-w-[150px]">{s.customerName ? `Cust: ${s.customerName}` : ''}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="p-2 text-primary-600 bg-primary-50 rounded-lg">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>
          )}
        />
      </Card>

      <Modal open={modal} onClose={() => { setModal(false); resetForm(); }} title={editingId ? "Edit Sales Entry" : "Submit Sales Entry"} wide>
        {submitError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-100">{submitError}</div>}
        <form onSubmit={submit} className="space-y-6 pb-48">

          <div className="space-y-4">
             {items.map((row, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                   <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                         <Select
                            label="Product Name"
                            value={row.productId}
                            onChange={(e) => updateRow(idx, 'productId', e.target.value)}
                            options={[
                                { value: '', label: 'Select product...' },
                                ...metadata.products.map(p => ({ value: p._id, label: `${p.productName} (Stock: ${p.quantity})` }))
                            ]}
                            required
                            className="h-10"
                         />
                      </div>
                      {!editingId && items.length > 1 && (
                         <button type="button" onClick={() => removeRow(idx)} className="mt-6 text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-5 w-5" />
                         </button>
                      )}
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="QTY"
                        type="number"
                        min="1"
                        required
                        value={row.quantity}
                        onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                        className="h-10"
                      />
                      <Input
                        label="Unit Price"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={row.sellingPrice}
                        onChange={(e) => updateRow(idx, 'sellingPrice', e.target.value)}
                        className="h-10"
                      />
                      <div className="space-y-1.5">
                         <span className="block text-sm font-medium">Amount</span>
                         <div className="h-10 px-3 flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
                            {formatMoney(row.amount)}
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>

          {!editingId && (
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" /> Add Product Row
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4 border-t dark:border-slate-800">
             <div className="space-y-4">
                <div className="space-y-1">
                    <label className="block text-sm font-medium">Customer Name</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                            list="customer-list"
                            placeholder="Select or type customer name..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            />
                            <datalist id="customer-list">
                                {metadata.customers.map(c => <option key={c._id} value={c.name} />)}
                            </datalist>
                        </div>
                        <Button type="button" variant="outline" size="md" className="shrink-0 px-2" title="Quick Add Customer" onClick={() => setCustModal(true)}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Textarea label="Remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional internal notes..." />
             </div>

             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-primary-100 dark:border-primary-900/20 space-y-4 shadow-inner">
                <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Total Entry Amount</span>
                    <span className="text-3xl font-black text-primary-600 leading-none">{formatMoney(totalAmount)}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic text-right border-t pt-2 border-slate-200 dark:border-slate-800">
                    {editingId ? 'Updating single record' : `Calculated for ${items.length} items`}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setModal(false); resetForm(); }} className="px-6">Cancel</Button>
                    <Button type="submit" loading={saving} className="px-8">
                        {editingId ? 'Update Entry' : 'Submit Sale'}
                    </Button>
                </div>
             </div>
          </div>
        </form>
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal open={custModal} onClose={() => setCustModal(false)} title="Quick Add Customer">
        <form onSubmit={submitQuickCustomer} className="space-y-4">
          <Input label="Business Name *" required value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} />
          <Input label="Address" value={custForm.address} onChange={(e) => setCustForm({ ...custForm, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Number" value={custForm.contactNumber} onChange={(e) => setCustForm({ ...custForm, contactNumber: e.target.value })} />
            <Input label="PAN/VAT" value={custForm.panVat} onChange={(e) => setCustForm({ ...custForm, panVat: e.target.value })} />
          </div>
          <Input label="Owner Name" value={custForm.ownerName} onChange={(e) => setCustForm({ ...custForm, ownerName: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCustModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save & Select</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
