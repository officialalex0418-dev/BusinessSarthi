import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, LifeBuoy, ChevronRight, Clock, AlertCircle,
  Building2, User, Filter, Eye
} from 'lucide-react';
import { api } from '@/api/client';
import {
  Card, CardHeader, CardBody, Badge, Button,
  Spinner, Pagination, Input, Select
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  WAITING_FOR_USER: 'orange',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const PRIORITY_COLORS = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export default function SupportManagement() {
  const [data, setData] = useState({ items: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [filters, setFilter] = useState({
    page: 1, limit: 15, search: '', status: '', priority: '', category: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/support', { params: filters });
      setData({ items: res.data.items, pagination: res.data.pagination });
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <LifeBuoy className="h-6 w-6 text-primary-600" />
            Support Management
          </h1>
          <p className="text-slate-500 text-sm">Review and resolve customer support requests from all companies.</p>
        </div>
      </div>

      <Card>
        <CardHeader title="All Support Tickets" />
        <CardBody className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Ticket #, subject, company..."
                  value={filters.search}
                  onChange={e => setFilter({ ...filters, search: e.target.value, page: 1 })}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                value={filters.status}
                onChange={e => setFilter({ ...filters, status: e.target.value, page: 1 })}
                options={[
                    { label: 'All Statuses', value: '' },
                    ...Object.keys(STATUS_COLORS).map(s => ({ label: s.replace('_', ' '), value: s }))
                ]}
              />
              <Select
                value={filters.priority}
                onChange={e => setFilter({ ...filters, priority: e.target.value, page: 1 })}
                options={[
                    { label: 'All Priorities', value: '' },
                    ...Object.keys(PRIORITY_COLORS).map(p => ({ label: p, value: p }))
                ]}
              />
              <Select
                value={filters.category}
                onChange={e => setFilter({ ...filters, category: e.target.value, page: 1 })}
                options={[
                    { label: 'All Categories', value: '' },
                    { label: 'Technical', value: 'TECHNICAL_ISSUE' },
                    { label: 'Billing', value: 'BILLING' },
                    { label: 'Attendance', value: 'ATTENDANCE' },
                    { label: 'Account', value: 'ACCOUNT' },
                ]}
              />
           </div>

           {loading ? <Spinner /> : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <tr>
                        <th className="px-4 py-3">Ticket</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Last Activity</th>
                        <th className="px-4 py-3"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm italic">No tickets found matches your filters.</td>
                      </tr>
                    ) : data.items.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                           <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{ticket.ticketNumber}</span>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{ticket.company?.name}</span>
                              <span className="text-[10px] text-slate-400">By {ticket.createdBy?.name}</span>
                           </div>
                        </td>
                        <td className="px-4 py-4 max-w-[200px] truncate font-medium text-slate-700">{ticket.subject}</td>
                        <td className="px-4 py-4">
                           <Badge color={STATUS_COLORS[ticket.status]}>{ticket.status?.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-4">
                           <Badge color={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</Badge>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                           {formatDate(ticket.lastActivityAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                           <Link to={`/admin/support/${ticket._id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                 <Eye className="h-4 w-4" />
                                 Review
                              </Button>
                           </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           )}

           <Pagination
             pagination={data.pagination}
             onPage={page => setFilter({ ...filters, page })}
           />
        </CardBody>
      </Card>
    </div>
  );
}
