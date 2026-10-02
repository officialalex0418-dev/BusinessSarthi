import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { Card, Button, Input, Select, Modal, Badge, DatePicker, Textarea, Spinner, Table, EmptyState } from '@/components/ui';
import { Truck, CreditCard, Plus, Search, FileText, CheckCircle2, PackageCheck } from 'lucide-react';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';

const emptyPayment = {
  distributorId: '',
  amount: 0,
  method: 'Cash',
  paymentDate: new Date().toISOString().split('T')[0],
  remarks: ''
};

export default function StockistDispatchPayment() {
  const [invoices, setInvoices] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'payment'
  const [payForm, setPayForm] = useState(emptyPayment);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, outRes] = await Promise.all([
        api.get('/sales-invoices'),
        api.get('/distributors')
      ]);
      setInvoices(invRes.data.data.items || invRes.data.data || []);
      setOutlets(outRes.data.data.items || outRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dispatch & payment data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateDispatchStatus = async (invoiceId, status) => {
    try {
      await api.patch(`/sales-invoices/${invoiceId}`, { remarks: status });
      setInvoices(invoices.map(inv => inv._id === invoiceId ? { ...inv, remarks: status } : inv));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update dispatch status');
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payForm.distributorId) {
      setError('Please select an outlet');
      return;
    }
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.post('/payments', payForm);
      setModal(null);
      setPayForm(emptyPayment);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.distributor?.name?.toLowerCase().includes(q) ||
      inv.customerName?.toLowerCase().includes(q) ||
      inv.remarks?.toLowerCase().includes(q)
    );
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Dispatch and Payment</h1>
          <p className="text-xs text-slate-500 sm:text-sm">Manage invoice dispatch status and record outlet payments</p>
        </div>
        <Button onClick={() => { setPayForm(emptyPayment); setModal('payment'); }}>
          <CreditCard className="h-4 w-4 mr-2" /> Record Payment
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search invoices or outlets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500">
            Total Invoices: <span className="font-bold">{filteredInvoices.length}</span>
          </div>
        </div>

        <Table
          columns={['Date & Time', 'Invoice #', 'Outlet / Customer', 'Net Total', 'Payment Mode', 'Dispatch Status / Remarks', 'Actions']}
          data={filteredInvoices}
          renderRow={(inv) => (
            <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="table-td text-xs text-slate-500">{formatDateTime(inv.saleDate)}</td>
              <td className="table-td font-mono font-bold">{inv.invoiceNumber}</td>
              <td className="table-td font-medium">{inv.distributor?.name || inv.customerName || 'Walk-in'}</td>
              <td className="table-td font-bold text-primary-600">{formatMoney(inv.netTotal)}</td>
              <td className="table-td text-xs">{inv.paymentMethod}</td>
              <td className="table-td">
                <select
                  value={['Billed', 'Packed', 'Out for dispatch', 'Completed'].includes(inv.remarks) ? inv.remarks : 'Billed'}
                  onChange={(e) => updateDispatchStatus(inv._id, e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Billed">Billed</option>
                  <option value="Packed">Packed</option>
                  <option value="Out for dispatch">Out for dispatch</option>
                  <option value="Completed">Completed</option>
                </select>
              </td>
              <td className="table-td">
                <Badge color={
                  inv.remarks === 'Completed' ? 'green' :
                  inv.remarks === 'Out for dispatch' ? 'blue' :
                  inv.remarks === 'Packed' ? 'yellow' : 'gray'
                }>
                  {inv.remarks || 'Billed'}
                </Badge>
              </td>
            </tr>
          )}
          mobileRender={(inv) => (
            <div key={inv._id} className="p-4 border-b space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-slate-500">{inv.invoiceNumber}</span>
                  <p className="font-bold">{inv.distributor?.name || inv.customerName || 'Walk-in'}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(inv.saleDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary-600">{formatMoney(inv.netTotal)}</p>
                  <Badge color={inv.remarks === 'Completed' ? 'green' : 'blue'}>{inv.remarks || 'Billed'}</Badge>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                <select
                  value={['Billed', 'Packed', 'Out for dispatch', 'Completed'].includes(inv.remarks) ? inv.remarks : 'Billed'}
                  onChange={(e) => updateDispatchStatus(inv._id, e.target.value)}
                  className="h-8 px-2 text-xs font-semibold rounded border bg-white dark:bg-slate-800"
                >
                  <option value="Billed">Billed</option>
                  <option value="Packed">Packed</option>
                  <option value="Out for dispatch">Out for dispatch</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}
        />
      </Card>

      {/* Record Payment Modal */}
      <Modal open={modal === 'payment'} onClose={() => { setModal(null); setError(''); }} title="Record Payment">
        <form onSubmit={submitPayment} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100">{error}</div>}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Outlet *</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              value={payForm.distributorId}
              onChange={e => setPayForm({ ...payForm, distributorId: e.target.value })}
              required
            >
              <option value="">Select outlet...</option>
              {outlets.map(out => (
                <option key={out._id} value={out._id}>{out.name} ({out.phone || 'No phone'})</option>
              ))}
            </select>
          </div>

          <Input
            label="Amount *"
            type="number"
            min="0"
            step="0.01"
            required
            value={payForm.amount}
            onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
            placeholder="0.00"
          />

          <Select
            label="Payment Mode *"
            value={payForm.method}
            onChange={e => setPayForm({ ...payForm, method: e.target.value })}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Online/QR', label: 'QR / Online' },
              { value: 'Cheque', label: 'Cheque' }
            ]}
          />

          <DatePicker
            label="Date"
            value={payForm.paymentDate}
            onChange={val => setPayForm({ ...payForm, paymentDate: val })}
          />

          <Textarea
            label="Remarks"
            value={payForm.remarks}
            onChange={e => setPayForm({ ...payForm, remarks: e.target.value })}
            placeholder="Transaction ref, bank note, etc."
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
