import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Send, Clock, User, AlertCircle,
  LifeBuoy, CheckCircle2, MessageSquare, ShieldAlert,
  History, Info
} from 'lucide-react';
import { api } from '@/api/client';
import {
  Card, CardHeader, CardBody, Badge, Button,
  Spinner, Textarea, Select, Input
} from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AdminTicketDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/admin/support/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error('Failed to load ticket', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAdmins = useCallback(async () => {
    try {
      const { data: res } = await api.get('/staff', { params: { scope: 'system', role: 'ADMIN_EMPLOYEE' } });
      setAdmins(res.data.items);
    } catch (e) {}
  }, []);

  useEffect(() => { loadData(); loadAdmins(); }, [loadData, loadAdmins]);

  const updateTicket = async (fields) => {
    try {
        await api.patch(`/admin/support/${id}`, fields);
        loadData();
    } catch (e) { alert('Update failed'); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/support/${id}/replies`, { message: reply });
      setReply('');
      loadData();
    } catch (e) { alert('Reply failed'); }
    finally { setSubmitting(false); }
  };

  const handleNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/admin/support/${id}/notes`, { note });
      setNote('');
      loadData();
    } catch (e) { alert('Note failed'); }
  };

  if (loading) return <Spinner />;
  if (!item) return <div className="text-center py-24 text-slate-500">Ticket not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link to="/admin/support">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
           <div className="flex items-center gap-2 mb-0.5">
             <h1 className="text-xl font-bold text-slate-900">{item.subject}</h1>
             <Badge color="blue" size="xs">{item.ticketNumber}</Badge>
           </div>
           <p className="text-xs text-slate-400">Company: {item.company?.name} • Created by {item.createdBy?.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Badge color="orange">{item.priority}</Badge>
            <Badge color="blue">{item.status.replace('_', ' ')}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Conversation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardBody className="p-6">
               <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-slate-900 mb-1">{item.createdBy?.name} <span className="font-normal text-slate-400 text-xs ml-2">Customer Request</span></p>
                     <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                  </div>
               </div>

               <div ref={scrollRef} className="space-y-6 max-h-[600px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                  {item.messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.senderType === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                       <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                         msg.senderType === 'ADMIN' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                       }`}>
                          {msg.senderType === 'ADMIN' ? 'AD' : 'CU'}
                       </div>
                       <div className={`flex-1 min-w-0 flex flex-col ${msg.senderType === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl p-4 max-w-[90%] shadow-sm ${
                            msg.senderType === 'ADMIN'
                              ? 'bg-primary-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                          }`}>
                             <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5 font-medium px-1">
                            {msg.sender?.name} • {formatDateTime(msg.createdAt)}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>

               <form onSubmit={handleReply} className="pt-6 border-t border-slate-100">
                 <Textarea
                   placeholder="Reply to customer..."
                   value={reply}
                   onChange={e => setReply(e.target.value)}
                   className="mb-4"
                   rows={4}
                   required
                 />
                 <Button type="submit" loading={submitting} className="w-full gap-2 text-lg py-6">
                    <Send className="h-5 w-5" />
                    Send Response
                 </Button>
               </form>
            </CardBody>
          </Card>

          {/* Activity History */}
          <Card>
             <CardHeader title="Ticket Activity History" icon={<History className="h-4 w-4" />} />
             <CardBody>
                <div className="space-y-4">
                  {item.activity.map((a, i) => (
                    <div key={i} className="flex gap-3">
                       <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                       <div>
                          <p className="text-sm font-medium">
                            {a.action.replace('_', ' ')}
                            {a.newStatus && <span> to <Badge color="blue" size="xs">{a.newStatus}</Badge></span>}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDateTime(a.at)}</p>
                       </div>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Ticket Opened</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
             </CardBody>
          </Card>
        </div>

        {/* Sidebar Management (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader title="Management Actions" icon={<Settings className="h-4 w-4" />} />
            <CardBody className="p-4 space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
                  <Select
                    value={item.status}
                    onChange={e => updateTicket({ status: e.target.value })}
                    options={[
                        { label: 'Open', value: 'OPEN' },
                        { label: 'In Progress', value: 'IN_PROGRESS' },
                        { label: 'Waiting for User', value: 'WAITING_FOR_USER' },
                        { label: 'Resolved', value: 'RESOLVED' },
                        { label: 'Closed', value: 'CLOSED' },
                    ]}
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
                  <Select
                    value={item.priority}
                    onChange={e => updateTicket({ priority: e.target.value })}
                    options={[
                        { label: 'Low', value: 'LOW' },
                        { label: 'Medium', value: 'MEDIUM' },
                        { label: 'High', value: 'HIGH' },
                        { label: 'Urgent', value: 'URGENT' },
                    ]}
                    className="mb-4"
                  />

                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Assign To</label>
                  <Select
                    value={item.assignedTo?._id || ''}
                    onChange={e => updateTicket({ assignedTo: e.target.value })}
                    options={[
                      { label: 'Unassigned', value: '' },
                      ...admins.map(a => ({ label: a.name, value: a._id }))
                    ]}
                  />
               </div>
               <div className="pt-4 border-t border-slate-100">
                  <Button
                    variant="outline" color="green" className="w-full gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => updateTicket({ status: 'RESOLVED' })}
                    disabled={item.status === 'RESOLVED'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Resolved
                  </Button>
               </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Internal Team Notes" icon={<ShieldAlert className="h-4 w-4" />} />
            <CardBody className="p-4 space-y-4">
               <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                 {item.internalNotes.length === 0 ? (
                   <p className="text-xs text-slate-400 text-center py-4 italic">No internal discussion yet.</p>
                 ) : item.internalNotes.map((n, i) => (
                   <div key={i} className="p-3 rounded-xl bg-yellow-50 border border-yellow-100 shadow-sm">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{n.note}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-100">
                         <span className="text-[9px] text-slate-400 font-bold uppercase">{n.author?.name}</span>
                         <span className="text-[9px] text-slate-400">{formatDate(n.createdAt)}</span>
                      </div>
                   </div>
                 ))}
               </div>
               <div className="pt-2">
                 <Textarea
                   placeholder="Add internal note (visible only to admins)..."
                   value={note}
                   onChange={e => setNote(e.target.value)}
                   className="mb-2 text-xs"
                   rows={3}
                 />
                 <Button type="button" size="sm" variant="outline" className="w-full" onClick={handleNote}>Add Note</Button>
               </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer Info" icon={<Info className="h-4 w-4" />} />
            <CardBody className="p-4 space-y-3">
               <div className="text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Company</p>
                  <p className="font-semibold text-slate-700">{item.company?.name}</p>
               </div>
               <div className="text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Created By</p>
                  <p className="font-semibold text-slate-700">{item.createdBy?.name}</p>
                  <p className="text-xs text-slate-500">{item.createdBy?.email}</p>
               </div>
               <div className="text-sm">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Role</p>
                  <p className="font-semibold text-slate-700">{item.createdByType.replace('_', ' ')}</p>
               </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
