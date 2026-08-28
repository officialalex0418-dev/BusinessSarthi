import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ChevronLeft, Mail, Phone, Building2, User, Clock,
    Send, MessageSquare, Info, History, ShieldAlert
} from 'lucide-react';
import { api } from '@/api/client';
import {
  Card, CardHeader, CardBody, Badge, Button,
  Spinner, Input, Select, Textarea
} from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function InquiryDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/admin/inquiries/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error('Failed to load inquiry', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAdmins = useCallback(async () => {
    try {
      const { data: res } = await api.get('/staff', { params: { scope: 'system', role: 'ADMIN_EMPLOYEE' } });
      setAdmins(res.data?.items || []);
    } catch (e) {}
  }, []);

  useEffect(() => { loadData(); loadAdmins(); }, [loadData, loadAdmins]);

  const updateInquiry = async (fields) => {
    try {
        await api.patch(`/admin/inquiries/${id}`, fields);
        loadData();
    } catch (e) { alert('Update failed'); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/inquiries/${id}/replies`, { message: reply });
      setReply('');
      loadData();
    } catch (e) { alert('Reply failed'); }
    finally { setSubmitting(false); }
  };

  const handleNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/admin/inquiries/${id}/notes`, { note });
      setNote('');
      loadData();
    } catch (e) { alert('Note failed'); }
  };

  if (loading) return <Spinner />;
  if (!item) return <div>Inquiry not found</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link to="/admin/inquiries">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Inquiry Details</h1>
        <div className="ml-auto flex items-center gap-2">
            <Badge color="blue">{item.status?.replace('_', ' ')}</Badge>
            <Badge color="orange">{item.priority}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Info & Conversation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Inquiry Content" subtitle={`Subject: ${item.subject}`} />
            <CardBody>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed italic">
                "{item.message}"
              </div>
            </CardBody>
          </Card>

          {/* Conversation */}
          <Card>
            <CardHeader title="Conversation History" icon={<MessageSquare className="h-4 w-4" />} />
            <CardBody className="space-y-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {item.replies.length === 0 ? (
                  <p className="text-center py-8 text-sm text-slate-400">No replies sent yet.</p>
                ) : item.replies.map((r, i) => (
                  <div key={i} className={`flex flex-col ${r.senderType === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      r.senderType === 'ADMIN'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm">{r.message}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {r.senderType === 'ADMIN' ? `Sent by ${r.sender?.name}` : 'Visitor'} • {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="pt-4 border-t border-slate-100">
                <Textarea
                  placeholder="Type your reply to the customer..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <Button type="submit" loading={submitting} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Send Reply by Email
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Activity Timeline */}
          <Card>
             <CardHeader title="Activity Timeline" icon={<History className="h-4 w-4" />} />
             <CardBody>
                <div className="space-y-4">
                  {item.activity.map((a, i) => (
                    <div key={i} className="flex gap-3">
                       <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                       <div>
                          <p className="text-sm font-medium">
                            {a.action.replace('_', ' ')}
                            {a.newStatus && <span>: <Badge color="blue" size="xs">{a.newStatus}</Badge></span>}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDateTime(a.at)}</p>
                       </div>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Inquiry Received</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
             </CardBody>
          </Card>
        </div>

        {/* Right Col: Metadata & Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Visitor Information" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${item.email}`} className="text-primary-600 hover:underline">{item.email}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{item.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{item.companyName || 'No company provided'}</span>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Update Status</label>
                <Select
                  value={item.status}
                  onChange={e => updateInquiry({ status: e.target.value })}
                  options={[
                    { label: 'New', value: 'NEW' },
                    { label: 'In Progress', value: 'IN_PROGRESS' },
                    { label: 'Proposal Sent', value: 'PROPOSAL_SENT' },
                    { label: 'Negotiation', value: 'NEGOTIATION' },
                    { label: 'Pending Sign', value: 'PENDING_SIGN' },
                    { label: 'Onboarded', value: 'ONBOARDED' },
                    { label: 'Archived', value: 'ARCHIVED' },
                  ]}
                  className="mb-4"
                />

                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assign To</label>
                <Select
                  value={item.assignedTo?._id || ''}
                  onChange={e => updateInquiry({ assignedTo: e.target.value })}
                  options={[
                    { label: 'Unassigned', value: '' },
                    ...admins.map(a => ({ label: a.name, value: a._id }))
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Internal Notes" icon={<ShieldAlert className="h-4 w-4" />} />
            <CardBody className="space-y-4">
               <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                 {item.internalNotes.length === 0 ? (
                   <p className="text-xs text-slate-400 text-center py-4">No internal notes.</p>
                 ) : item.internalNotes.map((n, i) => (
                   <div key={i} className="p-2 rounded bg-yellow-50 border border-yellow-100">
                      <p className="text-xs text-slate-700">{n.note}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{n.author?.name} • {formatDate(n.createdAt)}</p>
                   </div>
                 ))}
               </div>
               <form onSubmit={handleNote} className="pt-2">
                 <Input
                   placeholder="Quick note..."
                   size="sm"
                   value={note}
                   onChange={e => setNote(e.target.value)}
                   className="mb-2"
                 />
                 <Button type="submit" size="sm" variant="outline" className="w-full">Add Note</Button>
               </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
