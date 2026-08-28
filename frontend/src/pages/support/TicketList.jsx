import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, LifeBuoy, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/api/client';
import {
  Card, CardHeader, CardBody, Badge, Button,
  Spinner, Pagination, Input, Modal, Select, Textarea
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

const CATEGORIES = [
  { label: 'Technical Issue', value: 'TECHNICAL_ISSUE' },
  { label: 'Account', value: 'ACCOUNT' },
  { label: 'Billing', value: 'BILLING' },
  { label: 'Attendance', value: 'ATTENDANCE' },
  { label: 'GPS / Location', value: 'GPS_LOCATION' },
  { label: 'Sales', value: 'SALES' },
  { label: 'Inventory', value: 'INVENTORY' },
  { label: 'Payroll', value: 'PAYROLL' },
  { label: 'Feature Request', value: 'FEATURE_REQUEST' },
  { label: 'Other', value: 'OTHER' },
];

const PRIORITIES = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
];

const STATUS_COLORS = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  WAITING_FOR_USER: 'orange',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

export default function TicketList() {
  const [data, setData] = useState({ items: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [filters, setFilter] = useState({ page: 1, limit: 10, search: '', status: '' });
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'TECHNICAL_ISSUE', priority: 'MEDIUM', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/support/tickets', { params: filters });
      setData({ items: res.data.items, pagination: res.data.pagination });
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/support/tickets', form);
      setCreateModal(false);
      setForm({ subject: '', category: 'TECHNICAL_ISSUE', priority: 'MEDIUM', description: '' });
      loadData();
    } catch (e) { alert('Failed to create ticket'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <LifeBuoy className="h-6 w-6 text-primary-600" />
            Support Center
          </h1>
          <p className="text-slate-500 text-sm">Need help? Create a ticket and our team will assist you.</p>
        </div>
        <Button onClick={() => setCreateModal(true)} className="gap-2 shadow-lg shadow-primary-200">
          <Plus className="h-4 w-4" />
          Create Support Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Input
            placeholder="Search by ticket number or subject..."
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
            { label: 'Open', value: 'OPEN' },
            { label: 'In Progress', value: 'IN_PROGRESS' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Closed', value: 'CLOSED' },
          ]}
        />
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-4">
          {data.items.length === 0 ? (
            <Card className="py-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <LifeBuoy className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No tickets found</h3>
              <p className="text-slate-500 max-w-xs">You haven't created any support tickets yet.</p>
            </Card>
          ) : data.items.map((ticket) => (
            <Link key={ticket._id} to={`/support/${ticket._id}`}>
              <Card className="hover:border-primary-200 hover:shadow-md transition-all group">
                <CardBody className="p-5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{ticket.ticketNumber}</span>
                      <Badge color={STATUS_COLORS[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate pr-4 group-hover:text-primary-600 transition-colors">{ticket.subject}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {ticket.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        pagination={data.pagination}
        onPage={page => setFilter({ ...filters, page })}
      />

      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Support Ticket"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Subject" required
            placeholder="Brief summary of the issue"
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORIES}
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            />
            <Select
              label="Priority"
              options={PRIORITIES}
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <Textarea
            label="Description" required rows={6}
            placeholder="Describe the problem in detail..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="pt-4 border-t border-slate-100 flex gap-3">
             <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
             <Button type="submit" loading={submitting} className="flex-1">Submit Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
