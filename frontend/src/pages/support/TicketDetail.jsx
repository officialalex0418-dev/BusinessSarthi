import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Send, Clock, User, AlertCircle,
  LifeBuoy, CheckCircle2, MessageSquare
} from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import {
  Card, CardHeader, CardBody, Badge, Button,
  Spinner, Textarea
} from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/support/tickets/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error('Failed to load ticket', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [item?.messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/support/tickets/${id}/replies`, { message });
      setMessage('');
      loadData();
    } catch (e) { alert('Reply failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;
  if (!item) return <div className="text-center py-24 text-slate-500">Ticket not found</div>;

  const isAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link to={isAdmin ? '/admin/support' : '/support'}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
           <div className="flex items-center gap-2 mb-0.5">
             <h1 className="text-xl font-bold text-slate-900">{item.subject}</h1>
             <Badge color="blue" size="xs">{item.ticketNumber}</Badge>
           </div>
           <p className="text-xs text-slate-400">Created on {formatDate(item.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Badge color="orange">{item.priority}</Badge>
            <Badge color="blue">{item.status?.replace('_', ' ')}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Conversation */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardBody className="p-6">
               <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-slate-900 mb-1">{item.createdBy?.name} <span className="font-normal text-slate-400 text-xs ml-2">Original Request</span></p>
                     <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                  </div>
               </div>

               <div ref={scrollRef} className="space-y-6 max-h-[600px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                  {item.messages.length === 0 ? (
                    <div className="text-center py-12">
                       <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                         <MessageSquare className="h-6 w-6 text-slate-300" />
                       </div>
                       <p className="text-sm text-slate-400 font-medium">Waiting for support team response...</p>
                    </div>
                  ) : item.messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.senderType === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                       <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                         msg.senderType === 'ADMIN' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                       }`}>
                          {msg.sender?.name?.[0].toUpperCase()}
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

               {item.status !== 'CLOSED' && (
                 <form onSubmit={handleReply} className="pt-6 border-t border-slate-100">
                   <Textarea
                     placeholder={isAdmin ? "Type your response to the customer..." : "Type your message to support..."}
                     value={message}
                     onChange={e => setMessage(e.target.value)}
                     className="mb-4"
                     rows={4}
                     required
                   />
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] text-slate-400 italic">Our team typically responds within 24 hours.</p>
                      <Button type="submit" loading={submitting} className="gap-2 px-8">
                        <Send className="h-4 w-4" />
                        Send Message
                      </Button>
                   </div>
                 </form>
               )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Ticket Details" />
            <CardBody className="p-4 space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <AlertCircle className="h-4 w-4 text-primary-500" />
                    {item.category.replace('_', ' ')}
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Company</label>
                  <p className="text-sm font-medium text-slate-700">{item.company?.name}</p>
               </div>
               {item.assignedTo && (
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned Support</label>
                    <p className="text-sm font-medium text-slate-700">{item.assignedTo?.name}</p>
                 </div>
               )}
               <div className="pt-4 border-t border-slate-100">
                  {item.status === 'RESOLVED' ? (
                     <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Ticket resolved on {formatDate(item.resolvedAt)}
                     </div>
                  ) : item.status === 'CLOSED' ? (
                    <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-2">
                       <LifeBuoy className="h-4 w-4 shrink-0 opacity-50" />
                       This ticket is closed.
                    </div>
                  ) : (
                    <p className="text-[10px] text-center text-slate-400">Active conversation</p>
                  )}
               </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
