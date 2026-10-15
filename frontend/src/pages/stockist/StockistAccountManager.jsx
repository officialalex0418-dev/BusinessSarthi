import { useEffect, useState, useCallback } from 'react';
import {
  Calculator, TrendingUp, CreditCard, Wallet, Coins, Plus, Download,
  Filter, Calendar, Building2, Trash2, Pencil, FileText, Receipt,
  PieChart, DollarSign, CheckCircle2, ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Input, Modal, Table, Spinner, Badge, Select, Textarea, DatePicker, Pagination } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';

const emptyExpense = { title: '', category: 'MISC', amount: 0, expenseDate: '', paymentMethod: 'CASH', paidTo: '', remarks: '' };
const emptyPayment = { distributorId: '', amount: 0, method: 'CASH', remarks: '', paymentDate: '', chequeDetails: { number: '', bankName: '', depositDate: '', maturityDate: '' } };

export default function StockistAccountManager() {
  const { user } = useAuth();
  const dateFormat = user?.company?.settings?.dateFormat || user?.stockist?.settings?.dateFormat || 'BS';

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'payments' | 'expenses'
  const [reportType, setReportType] = useState('PROFIT_LOSS'); // 'PROFIT_LOSS' | 'SALES' | 'PURCHASE' | 'PAYMENTS' | 'EXPENSES'

  // Custom Date Range State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Data States
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Modals & Forms
  const [modal, setModal] = useState(null); // 'payment' | 'expense'
  const [editingExpense, setEditingExpense] = useState(null);
  const [payForm, setPayForm] = useState(emptyPayment);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 10000
      };

      const [distRes, invRes, purRes, payRes, expRes] = await Promise.all([
        api.get('/distributors', { params: { limit: 10000 } }).catch(() => ({ data: { data: { items: [] } } })),
        api.get('/sales-invoices', { params }).catch(() => ({ data: { data: { items: [] } } })),
        api.get('/purchases', { params }).catch(() => ({ data: { data: { items: [] } } })),
        api.get('/payments', { params }).catch(() => ({ data: { data: { items: [] } } })),
        api.get('/expenses', { params }).catch(() => ({ data: { data: { items: [] } } }))
      ]);

      setOutlets(distRes.data.data?.items || []);
      setInvoices(invRes.data.data?.items || []);
      setPurchases(purRes.data.data?.items || []);
      setPayments(payRes.data.data?.items || []);
      setExpenses(expRes.data.data?.items || []);
    } catch (err) {
      console.error('Failed to load accounting data', err);
      setError('Failed to load accounting records. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Quick Preset Handlers
  const handleSetPreset = (type) => {
    const now = new Date();
    if (type === 'TODAY') {
      const d = now.toISOString().split('T')[0];
      setFromDate(d); setToDate(d);
    } else if (type === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];
      setFromDate(start); setToDate(end);
    } else if (type === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setFromDate(start); setToDate(end);
    } else if (type === 'CLEAR') {
      setFromDate(''); setToDate('');
    }
  };

  // Financial Calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.netTotal || inv.totalAmount) || 0), 0);
  const totalPurchases = purchases.reduce((sum, pur) => sum + (Number(pur.totalAmount || pur.amount) || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const totalOfficeExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const totalOutstandingDues = outlets.reduce((sum, o) => sum + (Number(o.outstandingBalance) || 0), 0);

  // COGS & Gross Profit Calculation
  let totalCOGS = 0;
  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const costPrice = Number(item.product?.costPrice ?? item.mrp ?? 0);
      const qty = Number(item.quantity) || 1;
      totalCOGS += (costPrice * qty);
    });
  });

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalOfficeExpenses;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Expense Submit
  const submitExpense = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense._id}`, expenseForm);
      } else {
        await api.post('/expenses', expenseForm);
      }
      setModal(null);
      setEditingExpense(null);
      setExpenseForm(emptyExpense);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  // Payment Submit
  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/payments', payForm);
      setModal(null);
      setPayForm(emptyPayment);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const stockistName = user?.stockist?.name || user?.company?.name || 'Stockist';
    const dateRangeStr = (fromDate && toDate) ? `${fromDate} to ${toDate}` : 'All Time';

    const wb = XLSX.utils.book_new();

    if (reportType === 'PROFIT_LOSS') {
      const dataRows = [
        [`${stockistName.toUpperCase()} — PROFIT & LOSS STATEMENT`],
        [`Period: ${dateRangeStr}`],
        [`Generated On: ${new Date().toLocaleString()}`],
        [],
        ['Metric', 'Amount (NPR)', 'Percentage (%)'],
        ['Total Sales Revenue', totalRevenue, '100.00%'],
        ['Cost of Goods Sold (COGS)', totalCOGS, `${totalRevenue > 0 ? ((totalCOGS / totalRevenue) * 100).toFixed(2) : '0.00'}%`],
        ['Gross Profit', grossProfit, `${grossMargin.toFixed(2)}%`],
        ['Less: Total Office Expenses', totalOfficeExpenses, `${totalRevenue > 0 ? ((totalOfficeExpenses / totalRevenue) * 100).toFixed(2) : '0.00'}%`],
        ['NET PROFIT / LOSS', netProfit, `${netMargin.toFixed(2)}%`],
        [],
        ['EXPENSE CATEGORY BREAKDOWN'],
        ['Category', 'Total Amount']
      ];

      // Group Expenses
      const catMap = {};
      expenses.forEach(exp => {
        catMap[exp.category] = (catMap[exp.category] || 0) + Number(exp.amount);
      });
      Object.entries(catMap).forEach(([cat, amt]) => {
        dataRows.push([cat, amt]);
      });

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Profit & Loss');

    } else if (reportType === 'SALES') {
      const dataRows = [
        [`${stockistName.toUpperCase()} — SALES REPORT`],
        [`Period: ${dateRangeStr}`],
        [],
        ['SN', 'Invoice NO', 'Outlet Name', 'Date', 'Payment Method', 'Items Count', 'Net Amount']
      ];

      invoices.forEach((inv, i) => {
        dataRows.push([
          i + 1,
          inv.invoiceNumber || '—',
          inv.distributor?.name || inv.customerName || 'Outlet',
          formatDate(inv.saleDate || inv.createdAt, dateFormat),
          inv.paymentMethod || 'Credit',
          inv.items?.length || 0,
          Number(inv.netTotal || inv.totalAmount) || 0
        ]);
      });

      dataRows.push([]);
      dataRows.push(['TOTAL SALES REVENUE', '', '', '', '', '', totalRevenue]);

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

    } else if (reportType === 'PURCHASE') {
      const dataRows = [
        [`${stockistName.toUpperCase()} — PURCHASE REPORT`],
        [`Period: ${dateRangeStr}`],
        [],
        ['SN', 'Purchase NO / Bill NO', 'Vendor Name', 'Date', 'Amount']
      ];

      purchases.forEach((pur, i) => {
        dataRows.push([
          i + 1,
          pur.purchaseNumber || pur.billNumber || '—',
          pur.vendor?.name || 'Vendor',
          formatDate(pur.purchaseDate || pur.createdAt, dateFormat),
          Number(pur.totalAmount || pur.amount) || 0
        ]);
      });

      dataRows.push([]);
      dataRows.push(['TOTAL PURCHASES', '', '', '', totalPurchases]);

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Report');

    } else if (reportType === 'PAYMENTS') {
      const dataRows = [
        [`${stockistName.toUpperCase()} — OUTLET PAYMENTS REPORT`],
        [`Period: ${dateRangeStr}`],
        [],
        ['SN', 'Payment Date', 'Outlet Name', 'Payment Method', 'Paid Amount', 'Remarks']
      ];

      payments.forEach((pay, i) => {
        dataRows.push([
          i + 1,
          formatDate(pay.paymentDate || pay.createdAt, dateFormat),
          pay.distributor?.name || 'Outlet',
          pay.method || 'CASH',
          Number(pay.amount) || 0,
          pay.remarks || ''
        ]);
      });

      dataRows.push([]);
      dataRows.push(['TOTAL PAYMENTS COLLECTED', '', '', '', totalPaymentsReceived, '']);

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Outlet Payments');

    } else if (reportType === 'EXPENSES') {
      const dataRows = [
        [`${stockistName.toUpperCase()} — OFFICE EXPENSES REPORT`],
        [`Period: ${dateRangeStr}`],
        [],
        ['SN', 'Expense Date', 'Title', 'Category', 'Paid To', 'Method', 'Amount', 'Remarks']
      ];

      expenses.forEach((exp, i) => {
        dataRows.push([
          i + 1,
          formatDate(exp.expenseDate || exp.createdAt, dateFormat),
          exp.title || 'Expense',
          exp.category || 'MISC',
          exp.paidTo || '—',
          exp.paymentMethod || 'CASH',
          Number(exp.amount) || 0,
          exp.remarks || ''
        ]);
      });

      dataRows.push([]);
      dataRows.push(['TOTAL OFFICE EXPENSES', '', '', '', '', '', totalOfficeExpenses, '']);

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Office Expenses');
    }

    XLSX.writeFile(wb, `${stockistName}_${reportType}_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Date Range Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary-600" /> Account Manager
          </h1>
          <p className="text-xs text-slate-500">Record, process, and analyze all stockist financial transactions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={activeTab === 'analytics' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('analytics')}>
            Financial Analytics
          </Button>
          <Button variant={activeTab === 'payments' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('payments')}>
            Outlet Payments
          </Button>
          <Button variant={activeTab === 'expenses' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('expenses')}>
            Office Expenses
          </Button>
        </div>
      </div>

      {/* Custom Date Range Toolbar */}
      <Card className="p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-900/50 border">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <DatePicker label="" placeholder="From Date" value={fromDate} onChange={setFromDate} className="h-9 text-xs" />
            <span className="text-xs text-slate-400 font-bold">to</span>
            <DatePicker label="" placeholder="To Date" value={toDate} onChange={setToDate} className="h-9 text-xs" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 text-xs px-2.5" onClick={() => handleSetPreset('TODAY')}>Today</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs px-2.5" onClick={() => handleSetPreset('THIS_MONTH')}>This Month</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs px-2.5" onClick={() => handleSetPreset('LAST_MONTH')}>Last Month</Button>
            {(fromDate || toDate) && (
              <Button size="sm" variant="ghost" className="h-8 text-xs px-2.5 text-red-500 hover:text-red-600" onClick={() => handleSetPreset('CLEAR')}>Clear</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Top Financial Analytics Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
        {/* Total Revenue */}
        <Card className="p-3 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Sales</p>
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1 truncate">{formatMoney(totalRevenue)}</p>
          <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">{invoices.length} Invoices</p>
        </Card>

        {/* COGS */}
        <Card className="p-3 border-l-4 border-l-blue-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cost of Goods (COGS)</p>
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1 truncate">{formatMoney(totalCOGS)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">Purchase Cost</p>
        </Card>

        {/* Gross Profit */}
        <Card className="p-3 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gross Profit</p>
          <p className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 mt-1 truncate">{formatMoney(grossProfit)}</p>
          <p className="text-[9px] text-indigo-600 font-bold mt-0.5">{grossMargin.toFixed(1)}% Gross Margin</p>
        </Card>

        {/* Office Expenses */}
        <Card className="p-3 border-l-4 border-l-orange-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Office Expenses</p>
          <p className="text-sm sm:text-base font-black text-orange-600 mt-1 truncate">{formatMoney(totalOfficeExpenses)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{expenses.length} Records</p>
        </Card>

        {/* Net Profit */}
        <Card className="p-3 border-l-4 border-l-purple-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net Profit</p>
          <p className={`text-sm sm:text-base font-black mt-1 truncate ${netProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{formatMoney(netProfit)}</p>
          <p className="text-[9px] text-purple-600 font-bold mt-0.5">{netMargin.toFixed(1)}% Net Margin</p>
        </Card>

        {/* Payments Collected */}
        <Card className="p-3 border-l-4 border-l-teal-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Payments Received</p>
          <p className="text-sm sm:text-base font-black text-teal-600 mt-1 truncate">{formatMoney(totalPaymentsReceived)}</p>
          <p className="text-[9px] text-teal-600 font-semibold mt-0.5">{payments.length} Payments</p>
        </Card>

        {/* Outstanding Dues */}
        <Card className="p-3 border-l-4 border-l-rose-500 bg-white dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Outlet Outstanding</p>
          <p className="text-sm sm:text-base font-black text-rose-600 mt-1 truncate">{formatMoney(totalOutstandingDues)}</p>
          <p className="text-[9px] text-rose-600 font-semibold mt-0.5">{outlets.filter(o => o.outstandingBalance > 0).length} Outlets Due</p>
        </Card>
      </div>

      {loading ? <div className="p-12 text-center"><Spinner /></div> : (
        <>
          {/* TAB 1: FINANCIAL REPORTS & STATEMENT */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <h3 className="font-bold text-base">Financial Statement & Reports</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-48 text-xs h-9"
                      options={[
                        { value: 'PROFIT_LOSS', label: 'Profit & Loss Statement' },
                        { value: 'SALES', label: 'Sales Report' },
                        { value: 'PURCHASE', label: 'Purchase Report' },
                        { value: 'PAYMENTS', label: 'Outlet Payments Report' },
                        { value: 'EXPENSES', label: 'Office Expenses Report' }
                      ]}
                    />
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 text-xs">
                      <Download className="h-4 w-4 mr-1.5" /> Export Excel
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {reportType === 'PROFIT_LOSS' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Net Profit / Loss</p>
                          <p className="text-3xl font-black mt-1 text-emerald-400">{formatMoney(netProfit)}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-400">Net Profit Margin</p>
                          <p className="text-xl font-bold text-white">{netMargin.toFixed(2)}%</p>
                        </div>
                      </div>

                      <div className="border rounded-xl overflow-hidden divide-y text-sm">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between font-bold">
                          <span>Total Sales Revenue</span>
                          <span className="text-emerald-600">{formatMoney(totalRevenue)}</span>
                        </div>
                        <div className="p-4 flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Less: Cost of Goods Sold (COGS)</span>
                          <span>- {formatMoney(totalCOGS)}</span>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between font-bold text-indigo-700 dark:text-indigo-300">
                          <span>Gross Profit</span>
                          <span>{formatMoney(grossProfit)} ({grossMargin.toFixed(1)}%)</span>
                        </div>
                        <div className="p-4 flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Less: Office Expenses</span>
                          <span className="text-rose-600">- {formatMoney(totalOfficeExpenses)}</span>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between font-black text-base">
                          <span>NET PROFIT</span>
                          <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatMoney(netProfit)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'SALES' && (
                    <Table
                      columns={['Invoice #', 'Outlet Name', 'Date', 'Payment Method', 'Net Total']}
                      data={invoices}
                      renderRow={(inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50 text-sm">
                          <td className="table-td font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="table-td font-semibold">{inv.distributor?.name || inv.customerName || 'Outlet'}</td>
                          <td className="table-td">{formatDate(inv.saleDate || inv.createdAt, dateFormat)}</td>
                          <td className="table-td"><Badge color="blue">{inv.paymentMethod}</Badge></td>
                          <td className="table-td font-bold text-emerald-600">{formatMoney(inv.netTotal || inv.totalAmount)}</td>
                        </tr>
                      )}
                    />
                  )}

                  {reportType === 'PURCHASE' && (
                    <Table
                      columns={['Purchase #', 'Vendor Name', 'Date', 'Amount']}
                      data={purchases}
                      renderRow={(pur) => (
                        <tr key={pur._id} className="hover:bg-slate-50 text-sm">
                          <td className="table-td font-mono text-xs">{pur.purchaseNumber || pur.billNumber || '—'}</td>
                          <td className="table-td font-semibold">{pur.vendor?.name || 'Vendor'}</td>
                          <td className="table-td">{formatDate(pur.purchaseDate || pur.createdAt, dateFormat)}</td>
                          <td className="table-td font-bold">{formatMoney(pur.totalAmount || pur.amount)}</td>
                        </tr>
                      )}
                    />
                  )}

                  {reportType === 'PAYMENTS' && (
                    <Table
                      columns={['Payment Date', 'Outlet Name', 'Method', 'Amount', 'Remarks']}
                      data={payments}
                      renderRow={(pay) => (
                        <tr key={pay._id} className="hover:bg-slate-50 text-sm">
                          <td className="table-td">{formatDate(pay.paymentDate || pay.createdAt, dateFormat)}</td>
                          <td className="table-td font-semibold">{pay.distributor?.name || 'Outlet'}</td>
                          <td className="table-td"><Badge color="teal">{pay.method}</Badge></td>
                          <td className="table-td font-bold text-emerald-600">{formatMoney(pay.amount)}</td>
                          <td className="table-td text-xs text-slate-500">{pay.remarks || '—'}</td>
                        </tr>
                      )}
                    />
                  )}

                  {reportType === 'EXPENSES' && (
                    <Table
                      columns={['Expense Date', 'Title', 'Category', 'Paid To', 'Method', 'Amount']}
                      data={expenses}
                      renderRow={(exp) => (
                        <tr key={exp._id} className="hover:bg-slate-50 text-sm">
                          <td className="table-td">{formatDate(exp.expenseDate || exp.createdAt, dateFormat)}</td>
                          <td className="table-td font-semibold">{exp.title}</td>
                          <td className="table-td"><Badge color="orange">{exp.category}</Badge></td>
                          <td className="table-td text-xs">{exp.paidTo || '—'}</td>
                          <td className="table-td text-xs">{exp.paymentMethod}</td>
                          <td className="table-td font-bold text-rose-600">{formatMoney(exp.amount)}</td>
                        </tr>
                      )}
                    />
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: OUTLET PAYMENTS MANAGER */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-teal-600" />
                    <h3 className="font-bold text-base">Recorded Outlet Payments</h3>
                  </div>

                  <Button onClick={() => { setPayForm(emptyPayment); setModal('payment'); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Record Payment
                  </Button>
                </div>

                <Table
                  columns={['Payment Date', 'Outlet Name', 'Payment Method', 'Paid Amount', 'Remarks']}
                  data={payments}
                  renderRow={(pay) => (
                    <tr key={pay._id} className="hover:bg-slate-50 text-sm">
                      <td className="table-td">{formatDate(pay.paymentDate || pay.createdAt, dateFormat)}</td>
                      <td className="table-td font-semibold text-primary-600">{pay.distributor?.name || 'Outlet'}</td>
                      <td className="table-td"><Badge color="teal">{pay.method}</Badge></td>
                      <td className="table-td font-bold text-emerald-600">{formatMoney(pay.amount)}</td>
                      <td className="table-td text-xs text-slate-500">{pay.remarks || '—'}</td>
                    </tr>
                  )}
                  mobileRender={(pay) => (
                    <div key={pay._id} className="p-4 border-b space-y-1 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{pay.distributor?.name || 'Outlet'}</p>
                          <p className="text-xs text-slate-400">{formatDate(pay.paymentDate || pay.createdAt, dateFormat)}</p>
                        </div>
                        <p className="font-black text-emerald-600">{formatMoney(pay.amount)}</p>
                      </div>
                      <Badge color="teal" className="text-[10px]">{pay.method}</Badge>
                    </div>
                  )}
                />
              </Card>
            </div>
          )}

          {/* TAB 3: OFFICE EXPENSES MANAGER */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-orange-600" />
                    <h3 className="font-bold text-base">Stockist Office Expenses</h3>
                  </div>

                  <Button onClick={() => { setEditingExpense(null); setExpenseForm(emptyExpense); setModal('expense'); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Add Office Expense
                  </Button>
                </div>

                <Table
                  columns={['Expense Date', 'Title', 'Category', 'Paid To', 'Method', 'Amount', 'Actions']}
                  data={expenses}
                  renderRow={(exp) => (
                    <tr key={exp._id} className="hover:bg-slate-50 text-sm">
                      <td className="table-td">{formatDate(exp.expenseDate || exp.createdAt, dateFormat)}</td>
                      <td className="table-td font-semibold">{exp.title}</td>
                      <td className="table-td"><Badge color="orange">{exp.category}</Badge></td>
                      <td className="table-td text-xs">{exp.paidTo || '—'}</td>
                      <td className="table-td text-xs">{exp.paymentMethod}</td>
                      <td className="table-td font-bold text-rose-600">{formatMoney(exp.amount)}</td>
                      <td className="table-td">
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            onClick={() => { setEditingExpense(exp); setExpenseForm({ ...exp }); setModal('expense'); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            onClick={() => deleteExpense(exp._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  mobileRender={(exp) => (
                    <div key={exp._id} className="p-4 border-b space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{exp.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(exp.expenseDate || exp.createdAt, dateFormat)}</p>
                        </div>
                        <p className="font-black text-rose-600">{formatMoney(exp.amount)}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <Badge color="orange" className="text-[10px]">{exp.category}</Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 p-2" onClick={() => { setEditingExpense(exp); setExpenseForm({ ...exp }); setModal('expense'); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="danger" className="h-8 p-2" onClick={() => deleteExpense(exp._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </Card>
            </div>
          )}
        </>
      )}

      {/* RECORD OUTLET PAYMENT MODAL */}
      <Modal open={modal === 'payment'} onClose={() => setModal(null)} title="Record Outlet Payment">
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={submitPayment} className="space-y-4">
          <Select
            label="Select Outlet *"
            required
            value={payForm.distributorId}
            onChange={(e) => setPayForm({ ...payForm, distributorId: e.target.value })}
            options={[
              { value: '', label: 'Select Outlet...' },
              ...outlets.map(o => ({ value: o._id, label: `${o.name} (Due: ${formatMoney(o.outstandingBalance)})` }))
            ]}
          />
          <Input
            label="Amount Received *"
            type="number"
            required
            min="1"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />
          <Select
            label="Payment Method *"
            required
            value={payForm.method}
            onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'CHEQUE', label: 'Cheque' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'ONLINE', label: 'Online / QR' }
            ]}
          />
          <DatePicker
            label="Payment Date"
            value={payForm.paymentDate}
            onChange={(val) => setPayForm({ ...payForm, paymentDate: val })}
          />
          <Textarea
            label="Remarks"
            value={payForm.remarks}
            onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
            placeholder="Notes or reference number..."
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Record Payment (FIFO)</Button>
          </div>
        </form>
      </Modal>

      {/* ADD / EDIT EXPENSE MODAL */}
      <Modal open={modal === 'expense'} onClose={() => setModal(null)} title={editingExpense ? 'Edit Expense Record' : 'Add Office Expense'}>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={submitExpense} className="space-y-4">
          <Input
            label="Expense Title *"
            required
            placeholder="e.g. Office Rent, Electricity Bill, Staff Lunch"
            value={expenseForm.title}
            onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category *"
              required
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              options={[
                { value: 'RENT', label: 'Rent' },
                { value: 'UTILITIES', label: 'Utilities (Electricity/Water)' },
                { value: 'SALARY', label: 'Staff Salary' },
                { value: 'FUEL', label: 'Fuel & Transport' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'SUPPLIES', label: 'Office Supplies' },
                { value: 'MARKETING', label: 'Marketing' },
                { value: 'TAX', label: 'Tax & Fees' },
                { value: 'MISC', label: 'Miscellaneous' }
              ]}
            />
            <Input
              label="Amount (NPR) *"
              type="number"
              required
              min="0"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Expense Date"
              value={expenseForm.expenseDate}
              onChange={(val) => setExpenseForm({ ...expenseForm, expenseDate: val })}
            />
            <Select
              label="Payment Method"
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'ONLINE', label: 'Online / QR' }
              ]}
            />
          </div>
          <Input
            label="Paid To"
            placeholder="e.g. Landlord, Electricity Authority"
            value={expenseForm.paidTo}
            onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
          />
          <Textarea
            label="Remarks"
            placeholder="Additional notes..."
            value={expenseForm.remarks}
            onChange={(e) => setExpenseForm({ ...expenseForm, remarks: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingExpense ? 'Update Expense' : 'Save Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
