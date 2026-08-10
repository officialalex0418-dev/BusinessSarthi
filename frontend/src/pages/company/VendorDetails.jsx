import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, CreditCard, History, Phone, Mail,
  MapPin, Hash, Plus, Printer, Download, Trash2, Edit, FileUp, FileDown, AlertCircle, FileText
} from 'lucide-react';
import { api, downloadFile } from '@/api/client';
import {
  Card, Button, Spinner, Table, Badge,
  EmptyState, Modal, Input, Select, Textarea, DatePicker
} from '@/components/ui';
import { formatMoney, formatDate, formatDateTime, fixFileUrl, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const emptyPayment = { amount: 0, method: 'CASH', remarks: '', paymentDate: '', chequeNumber: '', bankName: '', maturityDate: '' };

export default function VendorDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'payment'
  const [payForm, setPayForm] = useState(emptyPayment);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [purchaseVendorId, setPurchaseVendorId] = useState('');
  const [purchaseDiscountPct, setPurchaseDiscountPct] = useState(0);
  const [purchaseVatPct, setPurchaseVatPct] = useState(0);
  const dateFormat = user?.company?.settings?.dateFormat || 'BS';

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/sales/metadata');
      setAllProducts(data.data.products);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vendors/${id}`);
      setData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); loadProducts(); }, [load, loadProducts]);

  const handlePrintLedger = (e) => {
    if (e) e.preventDefault();
    const element = document.getElementById('vendor-ledger-table');
    if (!element) return;

    // Fix: Only select the table element to prevent double entry (text below table)
    const tableElement = element.querySelector('table');
    const tableHtml = tableElement ? tableElement.outerHTML : element.innerHTML;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const companyLogo = user?.company?.logo || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Vendor Ledger - ${vendor.name}</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; padding: 40px; color: #000; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 2.5px solid #000; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f0f0f0; font-weight: bold; text-transform: uppercase; }
            /* Hide the Actions column in print */
            th:last-child, td:last-child { display: none !important; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; text-transform: uppercase; }
            .ledger-title { font-size: 20px; font-weight: bold; text-decoration: underline; margin: 20px 0; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; }
            .no-print { display: none !important; }
            .text-right { text-align: right; }
            .whitespace-nowrap { white-space: nowrap; }
          </style>
        </head>
        <body>
          <div class="header">
            ${companyLogo ? `<img src="${companyLogo}" style="max-height: 80px;" /><br/>` : ''}
            <div class="company-name">${user?.company?.name || 'Business Sarthi'}</div>
            <div>${user?.company?.address || ''} | PAN: ${user?.company?.panVat || '—'}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <strong>Vendor:</strong> ${vendor.name}<br/>
              <strong>Address:</strong> ${vendor.address || '—'}
            </div>
            <div class="text-right">
              Date: ${new Date().toLocaleDateString()}<br/>
              <strong>Closing Balance: ${formatMoney(vendor.outstandingBalance)}</strong>
            </div>
          </div>

          <center><div class="ledger-title">VENDOR ACCOUNT LEDGER</div></center>

          ${tableHtml}

          <div class="footer">
            <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px;">Prepared By</div>
            <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px;">Authorized Signatory</div>
          </div>

          <script>
            window.onload = function() { window.print(); setTimeout(window.close, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportLedgerCSV = () => {
    const csvRows = [];
    csvRows.push(`"VENDOR ACCOUNT LEDGER - ${vendor.name}"`);
    csvRows.push(`"Generated On:",${new Date().toLocaleString()}`);
    csvRows.push(`"Outstanding Balance:",${formatMoney(vendor.outstandingBalance)}`);
    csvRows.push("");
    csvRows.push("Date,Type,Reference,Debit (+),Credit (-)");

    for (const item of history) {
      const row = [
        formatDateTime(item.date, dateFormat),
        item.type,
        `"${item.ref || ''}"`,
        item.type === 'PURCHASE' ? item.amount : 0,
        item.type === 'PAYMENT' ? item.amount : 0
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${vendor.name.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/vendor-payments', { ...payForm, vendorId: id });
      setModal(null);
      setPayForm(emptyPayment);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed';
      const details = err.response?.data?.details;
      if (details && Array.isArray(details)) {
        setError(`${msg}: ${details.map(d => d.message).join(', ')}`);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await api.delete(`/vendor-payments/${paymentId}`);
      load();
    } catch (err) {
      alert('Failed to delete payment');
    }
  };

  const handleBulkUpload = async (e) => {
    e?.preventDefault();
    if (!bulkFile) return;

    const formData = new FormData();
    formData.append('file', bulkFile);
    setUploading(true);
    try {
      const res = await api.post(`/vendors/${id}/bulk-transactions`, formData);
      alert(res.data.message);
      setModal(null);
      setBulkFile(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    downloadFile('/reports/bulk-upload-sample?type=VENDOR', 'Vendor_Bulk_Template.xlsx');
  };

  const startEdit = (item) => {
    setEditingItem(item);
    if (item.type === 'PAYMENT') {
      const p = payments.find(p => p._id === item.id);
      setPayForm({
        amount: p.amount,
        method: p.method,
        remarks: p.remarks || '',
        paymentDate: p.paymentDate.split('T')[0]
      });
      setModal('edit-payment');
    } else {
      const p = purchases.find(p => p._id === item.id);
      setPurchaseRows(p.items.map(i => ({
        ...i,
        productId: i.product || '',
        amount: i.amount || (i.price * i.quantity),
        expiryDate: i.expiryDate ? i.expiryDate.split('T')[0] : ''
      })));
      setPurchaseDiscountPct(p.discountPct || 0);
      setPurchaseVatPct(p.vatPct || 0);
      setPayForm({ paymentDate: p.createdAt.split('T')[0] });
      setModal('edit-purchase');
    }
  };

  const updatePurchaseRow = (index, field, value) => {
    const next = [...purchaseRows];
    next[index][field] = value;
    if (field === 'price' || field === 'quantity') {
      next[index].amount = (Number(next[index].price) || 0) * (Number(next[index].quantity) || 0);
    }
    setPurchaseRows(next);
  };

  const calculatePurchaseTotals = () => {
    const totalAmount = purchaseRows.reduce((sum, row) => sum + row.amount, 0);
    const discount = (totalAmount * purchaseDiscountPct) / 100;
    const taxableAmount = totalAmount - discount;
    const vat = (taxableAmount * purchaseVatPct) / 100;
    const netTotal = taxableAmount + vat;
    return { totalAmount, discount, taxableAmount, vat, netTotal };
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem.type === 'PAYMENT') {
        await api.patch(`/vendor-payments/${editingItem.id}`, payForm);
      } else {
        await api.patch(`/purchases/${editingItem.id}`, {
          purchaseDate: payForm.paymentDate,
          items: purchaseRows,
          discountPct: purchaseDiscountPct,
          vatPct: purchaseVatPct
        });
      }
      setModal(null);
      setEditingItem(null);
      setPayForm(emptyPayment);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (!data) return <EmptyState title="Vendor not found" />;

  const { vendor, purchases, payments, history } = data;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link to="/company/vendors" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{vendor.name}</h1>
            <p className="text-xs text-slate-500 sm:text-sm">Vendor Account Details</p>
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button onClick={() => setModal('payment')} className="w-full sm:w-auto">
            <CreditCard className="h-4 w-4 mr-2" /> Pay Vendor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        <Card className="p-4 sm:p-6 space-y-4">
          <h3 className="font-bold border-b pb-2">Profile Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Phone className="h-4 w-4 shrink-0" /> {vendor.phone || 'N/A'}
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Mail className="h-4 w-4 shrink-0" /> {vendor.email || 'N/A'}
            </div>
            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {vendor.address || 'N/A'}
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Hash className="h-4 w-4 shrink-0" /> PAN/VAT: {vendor.panVat || 'N/A'}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Total Outstanding (Payable)</p>
          <p className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400 mt-1">{formatMoney(vendor.outstandingBalance)}</p>
          <p className="text-[10px] sm:text-xs text-red-500 mt-2 italic">How much you owe to this vendor.</p>
        </Card>

        <Card className="p-4 sm:p-6 bg-slate-900 text-white sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Summary</p>
                <div className="mt-4 space-y-2">
                   <p className="text-sm">Total Purchases: <span className="font-bold">{formatMoney(purchases.reduce((s, p) => s + p.netTotal, 0))}</span></p>
                   <p className="text-sm">Total Paid: <span className="font-bold">{formatMoney(payments.reduce((s, p) => s + p.amount, 0))}</span></p>
                </div>
             </div>
             <History className="h-8 w-8 text-slate-700" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col border-b sm:flex-row sm:items-center sm:justify-between sm:px-4">
           <div className="flex gap-6 overflow-x-auto no-scrollbar border-b sm:border-none">
              <button className="px-4 py-4 text-sm font-bold border-b-2 border-primary-600 text-primary-600">Full Ledger</button>
           </div>
           <div className="flex flex-wrap gap-2 p-3 sm:py-2">
              <Button variant="outline" size="sm" onClick={() => setModal('bulk-upload')} className="flex-1 sm:flex-none">
                <FileUp className="h-4 w-4 mr-2" /> Upload
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintLedger} className="flex-1 sm:flex-none">
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={exportLedgerCSV} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
           </div>
        </div>

        <div id="vendor-ledger-table">
          <Table
            columns={['Date & Time', 'Type/Ref', 'Debit (Purchase)', 'Credit (Payment)', 'Status', 'Actions']}
            data={history}
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="table-td text-slate-500 whitespace-nowrap text-xs">{formatDateTime(item.date, dateFormat)}</td>
                <td className="table-td">
                  <p className="font-bold text-xs uppercase">{item.type}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.ref} {item.method ? `(${item.method})` : ''}
                  </p>
                  {item.chequeDetails?.number && (
                    <p className="text-[9px] text-blue-500 font-bold">
                      # {item.chequeDetails.number} | {item.chequeDetails.bankName || 'Bank'}
                    </p>
                  )}
                </td>
                <td className="table-td text-red-600 font-medium">
                  {item.type === 'PURCHASE' ? `+ ${formatMoney(item.amount)}` : ''}
                </td>
                <td className="table-td text-emerald-600 font-medium">
                  {item.type === 'PAYMENT' ? `- ${formatMoney(item.amount)}` : ''}
                </td>
                <td className="table-td">
                  <Badge color={item.type === 'PURCHASE' ? 'blue' : 'green'}>Recorded</Badge>
                </td>
                <td className="table-td no-print">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                    {item.type === 'PAYMENT' && (
                      <button onClick={() => deletePayment(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            mobileRender={(item) => (
              <div key={item.id} className="p-4 space-y-3 border-b dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">{formatDateTime(item.date, dateFormat)}</p>
                    <p className="font-bold text-xs uppercase">{item.type} {item.ref && `· ${item.ref}`}</p>
                  </div>
                  <Badge color={item.type === 'PURCHASE' ? 'blue' : 'green'}>{item.type === 'PURCHASE' ? 'Purchase' : 'Payment'}</Badge>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                     {item.method && <p className="text-[10px] text-slate-500">Method: {item.method}</p>}
                     {item.chequeDetails?.number && <p className="text-[10px] text-blue-500"># {item.chequeDetails.number}</p>}
                   </div>
                   <p className={cn("font-bold", item.type === 'PURCHASE' ? 'text-red-600' : 'text-emerald-600')}>
                      {item.type === 'PURCHASE' ? '+' : '-'}{formatMoney(item.amount)}
                   </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => startEdit(item)} className="flex-1 py-1">Edit</Button>
                  {item.type === 'PAYMENT' && (
                    <Button variant="outline" size="sm" onClick={() => deletePayment(item.id)} className="flex-1 py-1 text-red-500 hover:text-red-600">Delete</Button>
                  )}
                </div>
              </div>
            )}
          />
        </div>
      </Card>

      {/* Bulk Upload Modal */}
      <Modal open={modal === 'bulk-upload'} onClose={() => setModal(null)} title="Bulk Upload Vendor Ledger">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-bold">Instructions:</p>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Use the vendor-specific template for best results.</li>
                <li>Dates should be in <b>YYYY-MM-DD</b> format.</li>
                <li>Types allowed: <b>PURCHASE</b> or <b>PAYMENT</b>.</li>
                <li>Records will be marked with <b>"old transaction"</b> remark.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown className="h-4 w-4 mr-2" /> Download Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
            <input
              type="file"
              id="bulk-file-input-vendor"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={(e) => setBulkFile(e.target.files[0])}
            />
            {!bulkFile ? (
              <div className="cursor-pointer" onClick={() => document.getElementById('bulk-file-input-vendor').click()}>
                <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <FileUp className="h-6 w-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium">Click to select Excel file</p>
                <p className="text-xs text-slate-400 mt-1">.xlsx or .xls files only</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary-600 font-bold">
                  <FileText className="h-5 w-5" />
                  <span>{bulkFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setBulkFile(null)}>Remove file</Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleBulkUpload} loading={uploading} disabled={!bulkFile}>
              Start Upload & Process
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={modal === 'payment'} onClose={() => { setModal(null); setError(''); }} title="Record Payment to Vendor">
         <form onSubmit={submitPayment} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100">{error}</div>}

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 border">
               <p className="text-xs text-slate-500 uppercase font-bold">Outstanding Balance</p>
               <p className="text-xl font-black text-red-600">{formatMoney(vendor.outstandingBalance)}</p>
            </div>

            <Input
              label="Amount Paid *"
              type="number"
              required
              value={payForm.amount}
              onChange={e => setPayForm({...payForm, amount: e.target.value})}
              autoFocus
            />

            <Select
              label="Payment Method"
              value={payForm.method}
              onChange={e => setPayForm({...payForm, method: e.target.value})}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'CHEQUE', label: 'Cheque' }
              ]}
            />

            {payForm.method === 'CHEQUE' && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  label="Cheque Number"
                  value={payForm.chequeNumber}
                  onChange={e => setPayForm({...payForm, chequeNumber: e.target.value})}
                  placeholder="e.g. 012345"
                  required
                />
                <Input
                  label="Bank Name"
                  value={payForm.bankName}
                  onChange={e => setPayForm({...payForm, bankName: e.target.value})}
                  placeholder="e.g. Nabil Bank"
                  required
                />
              </div>
            )}

            <DatePicker
              label="Payment Date"
              value={payForm.paymentDate}
              onChange={val => setPayForm({...payForm, paymentDate: val})}
            />

            <Textarea
              label="Remarks"
              value={payForm.remarks}
              onChange={e => setPayForm({...payForm, remarks: e.target.value})}
              placeholder="Cheque number, bank ref, etc."
            />

            <div className="flex justify-end gap-2 pt-4">
               <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
               <Button type="submit" loading={saving}>Record Payment</Button>
            </div>
         </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal open={modal === 'edit-payment'} onClose={() => setModal(null)} title="Edit Payment Record">
         <form onSubmit={submitEdit} className="space-y-4">
            <Input
              label="Amount Paid *"
              type="number"
              required
              value={payForm.amount}
              onChange={e => setPayForm({...payForm, amount: e.target.value})}
            />
            <Select
              label="Payment Method"
              value={payForm.method}
              onChange={e => setPayForm({...payForm, method: e.target.value})}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'CHEQUE', label: 'Cheque' }
              ]}
            />

            {payForm.method === 'CHEQUE' && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  label="Cheque Number"
                  value={payForm.chequeNumber}
                  onChange={e => setPayForm({...payForm, chequeNumber: e.target.value})}
                  placeholder="e.g. 012345"
                  required
                />
                <Input
                  label="Bank Name"
                  value={payForm.bankName}
                  onChange={e => setPayForm({...payForm, bankName: e.target.value})}
                  placeholder="e.g. Nabil Bank"
                  required
                />
              </div>
            )}
            <DatePicker
              label="Payment Date"
              value={payForm.paymentDate}
              onChange={val => setPayForm({...payForm, paymentDate: val})}
            />
            <Textarea
              label="Remarks"
              value={payForm.remarks}
              onChange={e => setPayForm({...payForm, remarks: e.target.value})}
            />
            <div className="flex justify-end gap-2 pt-4">
               <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
               <Button type="submit" loading={saving}>Update Payment</Button>
            </div>
         </form>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal open={modal === 'edit-purchase'} onClose={() => setModal(null)} title="Edit Purchase Entry" wide>
         <form onSubmit={submitEdit} className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
               <strong>Inventory Sync:</strong> Editing items here updates the Vendor Statement.
               Note: If stock has already been sold, changing quantities may result in negative inventory balances.
            </div>

            <div className="flex gap-4 items-end">
               <DatePicker
                 label="Purchase Date"
                 value={payForm.paymentDate}
                 onChange={val => setPayForm({...payForm, paymentDate: val})}
               />
            </div>

          <div className="space-y-4">
            {purchaseRows.map((row, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative">
                <div className="flex gap-4">
                  <div className="flex-[2]">
                    <Select
                      label="Product Name"
                      className="w-full h-10"
                      value={row.productId}
                      onChange={(e) => {
                        const prod = allProducts.find(p => p._id === e.target.value);
                        updatePurchaseRow(idx, 'productId', e.target.value);
                        updatePurchaseRow(idx, 'productName', prod?.productName || '');
                        if (prod) {
                          updatePurchaseRow(idx, 'price', prod.costPrice);
                          updatePurchaseRow(idx, 'batch', prod.batchNumber || '');
                        }
                      }}
                      options={[
                        { value: '', label: 'Select product...' },
                        ...allProducts.map(p => ({
                          value: p._id,
                          label: `${p.productName} (Batch: ${p.batchNumber || 'N/A'})`
                        }))
                      ]}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input label="Batch NO" value={row.batch} onChange={e => updatePurchaseRow(idx, 'batch', e.target.value)} placeholder="Batch" className="h-10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-5 gap-3">
                  <Input label="Cost Price" type="number" min="0" step="0.01" value={row.price} onChange={e => updatePurchaseRow(idx, 'price', e.target.value)} required className="h-10 text-sm" />
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-slate-400 uppercase">MRP</span>
                    <div className="h-10 px-3 flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg border text-sm font-semibold">
                      {formatMoney(row.mrp || 0)}
                    </div>
                  </div>
                  <Input label="QTY" type="number" min="1" value={row.quantity} onChange={e => updatePurchaseRow(idx, 'quantity', e.target.value)} required className="h-10 text-sm" />
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-slate-400 uppercase">Amount</span>
                    <div className="h-10 px-3 flex items-center bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30 text-sm font-black text-primary-600">
                      {formatMoney(row.amount)}
                    </div>
                  </div>
                  <DatePicker label="EXP Date" value={row.expiryDate} onChange={val => updatePurchaseRow(idx, 'expiryDate', val)} className="h-10 text-sm" position="bottom-right" />
                </div>

                {purchaseRows.length > 1 && (
                  <button type="button" onClick={() => setPurchaseRows(purchaseRows.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 p-1.5 rounded-full border shadow-sm text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => setPurchaseRows([...purchaseRows, { productName: '', productId: '', batch: '', price: 0, quantity: 1, amount: 0, expiryDate: '' }])} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>

            <div className="flex flex-col items-end gap-2 border-t pt-4">
               <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-xs text-sm">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-bold text-right">{formatMoney(calculatePurchaseTotals().totalAmount)}</span>
                  <span className="text-slate-500 flex items-center">Discount %:</span>
                  <Input type="number" className="h-8 text-right" value={purchaseDiscountPct} onChange={e => setPurchaseDiscountPct(Number(e.target.value))} />
                  <span className="text-slate-500 flex items-center">VAT %:</span>
                  <Input type="number" className="h-8 text-right" value={purchaseVatPct} onChange={e => setPurchaseVatPct(Number(e.target.value))} />
                  <div className="col-span-2 border-t mt-2 pt-2 grid grid-cols-2">
                     <span className="text-base font-bold">Net Total:</span>
                     <span className="text-base font-bold text-right text-primary-600">{formatMoney(calculatePurchaseTotals().netTotal)}</span>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
               <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
               <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
