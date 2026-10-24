import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, TrendingUp, DollarSign, Package, Award, ShieldCheck, Filter } from 'lucide-react';
import { api } from '@/api/client';
import { Card, CardHeader, CardBody, Table, Badge, Spinner, Button, Select, DatePicker } from '@/components/ui';
import { formatMoney, toLocalDateString } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { adToBs, bsToAd } from '@/lib/nepaliDate';

export default function SalesStatistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dateFormat = user?.company?.settings?.dateFormat || user?.stockist?.settings?.dateFormat || 'BS';

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'vendor'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        vendorId: selectedVendorId || undefined
      };
      const { data } = await api.get('/reports/sales-statistics', { params });
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load sales statistics', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedVendorId]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handlePreset = (type) => {
    const now = new Date();
    const todayStr = toLocalDateString(now);
    if (type === 'LIFETIME') {
      setFromDate('');
      setToDate('');
    } else if (type === 'TODAY') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (type === 'THIS_MONTH') {
      if (dateFormat === 'BS') {
        const bsNow = adToBs(now);
        const startBsStr = `${bsNow.year}-${String(bsNow.month).padStart(2, '0')}-01`;
        setFromDate(toLocalDateString(bsToAd(startBsStr)));
        setToDate(todayStr);
      } else {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setFromDate(toLocalDateString(start));
        setToDate(todayStr);
      }
    }
  };

  if (loading && !stats) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Sales Statistics & Reports</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vendor')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'vendor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Vendor Sales Report
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <Card className="p-4 border-none shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DatePicker placeholder="Start Date" value={fromDate} onChange={setFromDate} className="w-full sm:w-40" />
          <span className="text-xs text-slate-400 font-bold">to</span>
          <DatePicker placeholder="End Date" value={toDate} onChange={setToDate} className="w-full sm:w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePreset('LIFETIME')}>Lifetime</Button>
          <Button variant="outline" size="sm" onClick={() => handlePreset('THIS_MONTH')}>This Month</Button>
          <Button variant="outline" size="sm" onClick={() => handlePreset('TODAY')}>Today</Button>
        </div>
      </Card>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Total Sales Card */}
          <Card className="p-6 border-none shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Sales (Selected Period)</p>
                <h2 className="text-3xl font-black mt-1">{formatMoney(stats.totalSales, 'NPR ')}</h2>
              </div>
              <div className="p-3 rounded-2xl bg-white/10"><TrendingUp className="h-8 w-8" /></div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Selling Products */}
            <Card>
              <CardHeader title="Best Selling Products" subtitle="Top products by quantity sold & sales amount" />
              <Table
                columns={['Product Name', 'Quantity Sold', 'Total Amount']}
                data={stats.bestSellingProducts}
                renderRow={(p, i) => (
                  <tr key={i} className="hover:bg-slate-50 text-sm">
                    <td className="table-td font-semibold">{p.name}</td>
                    <td className="table-td font-bold text-blue-600">{p.qty} Units</td>
                    <td className="table-td font-bold text-emerald-600">{formatMoney(p.amount, 'Rs. ')}</td>
                  </tr>
                )}
              />
            </Card>

            {/* Top Outlets */}
            <Card>
              <CardHeader title="Top Outlets" subtitle="Ranked highest to lowest by total purchase amount" />
              <Table
                columns={['Outlet Name', 'Invoices', 'Total Purchase Amount']}
                data={stats.topOutlets}
                renderRow={(o, i) => (
                  <tr key={i} className="hover:bg-slate-50 text-sm">
                    <td className="table-td font-semibold text-primary-600">{o.name}</td>
                    <td className="table-td">{o.invoiceCount}</td>
                    <td className="table-td font-bold text-emerald-600">{formatMoney(o.totalPurchased, 'Rs. ')}</td>
                  </tr>
                )}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Outlets (Health Score) */}
            <Card>
              <CardHeader title="Top Performing Outlets (Account Health)" subtitle="Outlets with minimal due balances & frequent timely payments" />
              <Table
                columns={['Outlet Name', 'Outstanding Due', 'Health Score']}
                data={stats.topPerformingOutlets}
                renderRow={(o, i) => (
                  <tr key={i} className="hover:bg-slate-50 text-sm">
                    <td className="table-td font-semibold">{o.name}</td>
                    <td className="table-td font-bold text-rose-600">{formatMoney(o.outstandingBalance, 'Rs. ')}</td>
                    <td className="table-td">
                      <Badge color={o.healthScore >= 80 ? 'green' : o.healthScore >= 50 ? 'blue' : 'yellow'}>
                        {o.healthScore}% Healthy
                      </Badge>
                    </td>
                  </tr>
                )}
              />
            </Card>

            {/* Top Performing Products (Margin) */}
            <Card>
              <CardHeader title="Top Performing Products by Margin" subtitle="Products generating highest profit margins" />
              <Table
                columns={['Product Name', 'Sold Qty', 'Profit Margin']}
                data={stats.topPerformingProducts}
                renderRow={(p, i) => (
                  <tr key={i} className="hover:bg-slate-50 text-sm">
                    <td className="table-td font-semibold">{p.name}</td>
                    <td className="table-td">{p.qty} Units</td>
                    <td className="table-td font-bold text-emerald-600">{formatMoney(p.margin, 'Rs. ')}</td>
                  </tr>
                )}
              />
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR SALES REPORT */}
      {activeTab === 'vendor' && stats && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold mb-3">Select Vendor</h3>
            <Select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              options={[
                { value: '', label: 'Select Vendor...' },
                ...stats.vendors.map(v => ({ value: v._id, label: v.name }))
              ]}
            />
          </Card>

          {selectedVendorId && stats.vendorReport ? (
            <div className="space-y-6">
              <Card className="p-6 bg-emerald-50 border-emerald-200">
                <p className="text-xs font-bold text-emerald-800 uppercase">Total Sales for Selected Vendor</p>
                <h2 className="text-3xl font-black text-emerald-900 mt-1">{formatMoney(stats.vendorReport.totalSales, 'NPR ')}</h2>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader title="Top Selling Products (This Vendor)" />
                  <Table
                    columns={['Product Name', 'Quantity Sold', 'Sales Amount']}
                    data={stats.vendorReport.topSellingProducts}
                    renderRow={(p, i) => (
                      <tr key={i} className="hover:bg-slate-50 text-sm">
                        <td className="table-td font-semibold">{p.name}</td>
                        <td className="table-td font-bold text-blue-600">{p.qty} Units</td>
                        <td className="table-td font-bold text-emerald-600">{formatMoney(p.amount, 'Rs. ')}</td>
                      </tr>
                    )}
                  />
                </Card>

                <Card>
                  <CardHeader title="Top Buying Outlets (This Vendor)" />
                  <Table
                    columns={['Outlet Name', 'Purchase Amount']}
                    data={stats.vendorReport.topBuyingOutlets}
                    renderRow={(o, i) => (
                      <tr key={i} className="hover:bg-slate-50 text-sm">
                        <td className="table-td font-semibold text-primary-600">{o.name}</td>
                        <td className="table-td font-bold text-emerald-600">{formatMoney(o.amount, 'Rs. ')}</td>
                      </tr>
                    )}
                  />
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 italic">Please select a vendor above to view their sales statistics report.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
