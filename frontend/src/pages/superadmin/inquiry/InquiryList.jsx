import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Building2, User, Search, Filter, MessageSquare, MoreVertical, Eye } from 'lucide-react';
import { api } from '@/api/client';
import {
  Table, Badge, Button, Card, CardHeader, CardBody,
  Spinner, Pagination, Input, Select
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS = {
  NEW: 'blue',
  IN_PROGRESS: 'yellow',
  PROPOSAL_SENT: 'purple',
  NEGOTIATION: 'orange',
  PENDING_SIGN: 'red',
  ONBOARDED: 'green',
  ARCHIVED: 'gray',
};

const PRIORITY_COLORS = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export default function InquiryList() {
  const [data, setData] = useState({ items: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilter] = useState({
    page: 1, limit: 15, search: '', status: '', priority: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/inquiries', { params: filters });
      setData({ items: res.data.items, pagination: res.data.pagination });
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('Failed to load inquiries', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = ['Visitor', 'Company', 'Subject', 'Status', 'Priority', 'Created', 'Actions'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(STATUS_COLORS).map(([key, color]) => (
          <Card key={key} className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{key.replace('_', ' ')}</p>
            <p className={`text-2xl font-black text-${color}-600`}>{stats[key] || 0}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Website Inquiries" subtitle="Manage leads and inquiries from your public website" />
        <CardBody className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search name, email, company, subject..."
                value={filters.search}
                onChange={(e) => setFilter({ ...filters, search: e.target.value, page: 1 })}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              value={filters.status}
              onChange={(e) => setFilter({ ...filters, status: e.target.value, page: 1 })}
              options={[
                { label: 'All Statuses', value: '' },
                ...Object.keys(STATUS_COLORS).map(s => ({ label: s.replace('_', ' '), value: s }))
              ]}
            />
            <Select
              value={filters.priority}
              onChange={(e) => setFilter({ ...filters, priority: e.target.value, page: 1 })}
              options={[
                { label: 'All Priorities', value: '' },
                ...Object.keys(PRIORITY_COLORS).map(p => ({ label: p, value: p }))
              ]}
            />
          </div>

          {loading ? <Spinner /> : (
            <Table
              columns={columns}
              data={data.items}
              renderRow={(item) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{item.companyName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="table-td max-w-xs truncate">{item.subject}</td>
                  <td className="table-td">
                    <Badge color={STATUS_COLORS[item.status]}>{item.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="table-td">
                    <Badge color={PRIORITY_COLORS[item.priority]}>{item.priority}</Badge>
                  </td>
                  <td className="table-td text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="table-td">
                    <Link to={`/admin/inquiries/${item._id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              )}
            />
          )}

          <Pagination
            pagination={data.pagination}
            onPage={(page) => setFilter({ ...filters, page })}
          />
        </CardBody>
      </Card>
    </div>
  );
}
