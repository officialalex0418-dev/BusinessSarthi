import { useEffect, useState, useCallback } from 'react';
import { Plus, RotateCcw, XCircle, FileText } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Input, Select, Modal, Table, Badge, Spinner, DatePicker, Pagination } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const REASONS = [
  { value: 'CUSTOMER_REQUEST', label: 'Customer Request' },
  { value: 'DEFECTIVE', label: 'Defective Product' },
  { value: 'EXPIRED', label: 'Expired Product' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Delivered' },
  { value: 'OTHER', label: 'Other' },
];

const REFUND_METHODS = [
  { value: 'Credit Adjustment', label: 'Credit Adjustment (Reduce Balance)' },
  { value: 'Cash', label: 'Cash Refund' },
  { value: 'Online/QR', label: 'Online / QR Refund' },
  { value: 'Cheque', label: 'Cheque Refund' },
];

const emptyRow = { product: '', productName: '', batch: 'GENERAL', price: 0, quantity: 1 };

export default function SalesReturnList() {
  const { user } = useAuth();
  const isStockist = user?.role === 'STOCKIST' || window.location.pathname.startsWith('/stockist');
  const entitySingular = isStockist ? 'Outlet' : 'Distributor';

  const [data, setData] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [modal, setModal] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const [form, setForm] = useState({
    distributorId: '',
    customerName: '',
    reason: 'CUSTOMER_REQUEST',
    refundMethod: 'Credit Adjustment',
    remarks: '',
    returnDate: '',
    items: [{ ...emptyRow }]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const params = { page, search: search || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined };
      const { data: res } = await api.get('/sales-returns', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load sales returns', err);
    }
  }, [page, search, fromDate, toDate]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    api.get('/distributors?limit=1000').then(({ data }) => setOutlets(data.data?.items || data.data || [])).catch(() => {});
    api.get('/inventory?limit=1000').then(({ data }) => setProducts(data.data?.items || data.data || [])).catch(() => {});
  }, []);

  const handleProductSelect = (idx, productId) => {
    const prod = products.find(p => p._id === productId);
    const newItems = [...form.items];
    if (prod) {
      newItems[idx] = {
        ...newItems[idx],
        product: prod._id,
        productName: prod.name || prod.productName,
        price: prod.sellingPrice || prod.price || 0,
        batch: prod.batch || 'GENERAL'
      };
    } else {
      newItems[idx] = { ...newItems[idx], product: '', productName: '' };
    }
    setForm({ ...form, items: newItems });
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setForm({ ...form, items: newItems });
  };

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, { ...emptyRow }] });
  };

  const removeItemRow = (idx) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/sales-returns', form);
      setModal(null);
      setForm({ distributorId: '', customerName: '', reason: 'CUSTOMER_REQUEST', refundMethod: 'Credit Adjustment', remarks: '', returnDate: '', items: [{ ...emptyRow }] });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sales return');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReturn = async (id) => {
    if (!confirm('Are you sure you want to cancel this sales return? Inventory stock and balances will be reverted.')) return;
    try {
      await api.delete(`/sales-returns/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel sales return');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-blue-600" /> Sales Return (Credit Notes)
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage customer/outlet product returns, restore inventory stock, and adjust credits.</p>
        </div>
        <Button onClick={() => { setError(''); setModal('create'); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Sales Return
        </Button>
      </div>

      <Card className="p-4 border-none shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search return # or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-60"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DatePicker placeholder="From Date" value={fromDate} onChange={setFromDate} className="w-36" />
          <span className="text-xs text-slate-400">to</span>
          <DatePicker placeholder="To Date" value={toDate} onChange={setToDate} className="w-36" />
        </div>
      </Card>

      {!data ? <Spinner /> : (
        <Card>
          <Table
            columns={['Return #', 'Return Date', `${entitySingular} / Customer`, 'Reason', 'Refund Method', 'Amount', 'Status', 'Actions']}
            data={data.items}
            renderRow={(r) => (
              <tr key={r._id} className="hover:bg-slate-50 text-sm">
                <td className="table-td font-bold text-blue-600">{r.returnNumber}</td>
                <td className="table-td">{formatDate(r.returnDate || r.createdAt)}</td>
                <td className="table-td font-semibold">{r.distributor?.name || r.customerName || '—'}</td>
                <td className="table-td"><Badge color="blue">{r.reason?.replace('_', ' ')}</Badge></td>
                <td className="table-td text-xs">{r.refundMethod}</td>
                <td className="table-td font-bold text-emerald-600">{formatMoney(r.totalAmount)}</td>
                <td className="table-td">
                  <Badge color={r.status === 'COMPLETED' ? 'green' : 'red'}>{r.status}</Badge>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Details" onClick={() => { setSelectedReturn(r); setModal('view'); }}>
                      <FileText className="h-4 w-4" />
                    </button>
                    {r.status === 'COMPLETED' && (
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel & Revert" onClick={() => handleCancelReturn(r._id)}>
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
          <Pagination pagination={data.pagination} onPage={setPage} />
        </Card>
      )}

      {/* CREATE SALES RETURN MODAL */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Sales Return" wide>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={`Select ${entitySingular}`}
              value={form.distributorId}
              onChange={(e) => setForm({ ...form, distributorId: e.target.value })}
              options={[{ value: '', label: `Select ${entitySingular}...` }, ...outlets.map(o => ({ value: o._id, label: o.name }))]}
            />
            <Input
              label="Customer Name (Fallback)"
              placeholder="e.g. Walk-in Customer"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
            <DatePicker
              label="Return Date"
              value={form.returnDate}
              onChange={(val) => setForm({ ...form, returnDate: val })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Return Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              options={REASONS}
            />
            <Select
              label="Refund / Credit Method"
              value={form.refundMethod}
              onChange={(e) => setForm({ ...form, refundMethod: e.target.value })}
              options={REFUND_METHODS}
            />
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Returned Products</h3>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="col-span-5">
                  <Select
                    label="Product *"
                    value={item.product}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    options={[{ value: '', label: 'Select Product...' }, ...products.map(p => ({ value: p._id, label: `${p.name || p.productName} (Stock: ${p.quantity || 0})` }))]}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Qty *"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Return Rate *"
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                  />
                </div>
                <div className="col-span-2 pb-2 text-right font-bold text-emerald-600">
                  {formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                </div>
                <div className="col-span-1 pb-2 text-right">
                  <button type="button" onClick={() => removeItemRow(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total Return Value</p>
              <h2 className="text-2xl font-black text-emerald-600">{formatMoney(calculateTotal())}</h2>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>Process Return</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal open={modal === 'view' && !!selectedReturn} onClose={() => setModal(null)} title={`Sales Return ${selectedReturn?.returnNumber}`}>
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-xs text-slate-400">Return Date</p>
                <p className="font-bold">{formatDate(selectedReturn.returnDate || selectedReturn.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{entitySingular} / Customer</p>
                <p className="font-bold text-blue-600">{selectedReturn.distributor?.name || selectedReturn.customerName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Reason</p>
                <p className="font-bold">{selectedReturn.reason?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Refund Method</p>
                <p className="font-bold">{selectedReturn.refundMethod}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReturn.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.productName}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">{formatMoney(item.price)}</td>
                      <td className="p-2 text-right font-bold text-emerald-600">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl">
              <span className="font-bold text-emerald-900">Total Credit Amount:</span>
              <span className="text-2xl font-black text-emerald-600">{formatMoney(selectedReturn.totalAmount)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
