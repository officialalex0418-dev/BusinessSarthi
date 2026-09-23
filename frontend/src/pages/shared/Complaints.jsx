import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Clock, User, Users, Send, ChevronLeft, MoreVertical, Paperclip, CheckCheck, Plus, Search, Bell } from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Spinner, Button, Input, Textarea, Modal, Select, Checkbox } from '@/components/ui';
import { formatDate, formatTime, cn } from '@/lib/utils';

function ConversationModal({ open, onClose, onSuccess, mode = 'CHAT' }) {
  const [recipients, setRecipients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    recipientType: 'group',
    recipientId: '',
    selectedParticipants: [],
    subject: '',
    message: ''
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/complaints/recipients').then(res => setRecipients(res.data.data));
    }
  }, [open]);

  const toggleParticipant = (userId) => {
    setForm(prev => {
      const current = prev.selectedParticipants;
      if (current.includes(userId)) {
        return { ...prev, selectedParticipants: current.filter(id => id !== userId) };
      } else {
        return { ...prev, selectedParticipants: [...current, userId] };
      }
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const endpoint = mode === 'CHAT' ? '/chats' : '/complaints';
      const isCustomGroup = form.recipientType === 'create_group';

      const payload = {
        isGroup: form.recipientType === 'group' || isCustomGroup,
        recipientId: form.recipientType === 'individual' ? form.recipientId : null,
        participants: isCustomGroup ? form.selectedParticipants : [],
        message: form.message
      };

      if (mode === 'COMPLAINT') {
        payload.subject = form.subject;
      } else if (isCustomGroup) {
        payload.groupName = form.subject;
      }

      await api.post(endpoint, payload);
      onSuccess();
      onClose();
      setForm({ recipientType: 'group', recipientId: '', selectedParticipants: [], subject: '', message: '' });
    } catch (err) {
      alert(`Could not start the ${mode.toLowerCase()}. Please check your connection.`);
    } finally {
      setBusy(false);
    }
  };

  const filteredRecipients = recipients.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.position || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} title={mode === 'COMPLAINT' ? "Add Complaint" : "New Chat"} wide={form.recipientType === 'create_group'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Recipient</label>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
            <Button
              type="button"
              variant={form.recipientType === 'group' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setForm({ ...form, recipientType: 'group' })}
              className="text-[10px] px-2 py-2"
            >
              Company Group
            </Button>
            <Button
              type="button"
              variant={form.recipientType === 'individual' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setForm({ ...form, recipientType: 'individual' })}
              className="text-[10px] px-2 py-2"
            >
              Specific Person
            </Button>
            <Button
              type="button"
              variant={form.recipientType === 'create_group' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setForm({ ...form, recipientType: 'create_group' })}
              className="text-[10px] px-2 py-2"
            >
              Create Group
            </Button>
          </div>
        </div>

        {form.recipientType === 'individual' && (
          <Select
            label="Select Recipient"
            value={form.recipientId}
            onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
            options={[
              { value: '', label: 'Select a person...' },
              ...recipients.map(r => ({ value: r._id, label: `${r.name} (${r.position || r.role})` }))
            ]}
            required
          />
        )}

        {form.recipientType === 'create_group' && (
          <div className="space-y-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="input pl-10 h-10 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y dark:divide-slate-800">
                {filteredRecipients.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No employees found</p>}
                {filteredRecipients.map(r => (
                  <div
                    key={r._id}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => toggleParticipant(r._id)}
                  >
                    <Checkbox checked={form.selectedParticipants.includes(r._id)} onChange={() => {}} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{r.position || r.role}</p>
                    </div>
                  </div>
                ))}
             </div>
             <p className="text-[11px] text-slate-400 font-medium">Selected: {form.selectedParticipants.length} people</p>
          </div>
        )}

        {(mode === 'COMPLAINT' || form.recipientType === 'create_group') && (
          <Input
            label={form.recipientType === 'create_group' ? "Group Name" : "Subject"}
            placeholder={form.recipientType === 'create_group' ? "e.g. Sales, Marketing..." : "What is the complaint about?"}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        )}

        <Textarea
          label="Message"
          placeholder="Type your message here..."
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={busy} disabled={form.recipientType === 'create_group' && form.selectedParticipants.length === 0}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChatView({ item, mode, onBack, onRead }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const endpoint = mode === 'CHAT' ? `/chats/${item._id}/messages` : `/complaints/${item._id}/messages`;

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await api.get(endpoint);
      setMessages(data.data);
      if (onRead) onRead(item._id);
    } finally {
      setLoading(false);
    }
  }, [endpoint, item._id, onRead]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e, attachments = []) => {
    if (e) e.preventDefault();
    if (!text.trim() && attachments.length === 0) return;
    if (sending) return;

    setSending(true);
    try {
      await api.post(endpoint, {
        message: text,
        attachments
      });
      setText('');
      loadMessages();
    } catch (err) {
      alert('Message not sent. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      await send(null, [reader.result]);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col bg-[#efeae2] dark:bg-slate-950">
      <div className="flex items-center justify-between bg-[#f0f2f5] px-4 py-2 dark:bg-slate-900 border-b dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-slate-600 font-bold uppercase">
            {item.isGroup ? <Users className="h-5 w-5" /> : (item.recipient?.name?.[0] || 'U')}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
              {mode === 'CHAT' && !item.isGroup ? (item.recipient?.name || 'User') : (item.subject || item.groupName)}
            </h3>
            <p className="text-[10px] text-slate-500 truncate">
              {item.isGroup ? (item.groupName || 'Group') : `Private Chat`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full p-2"><MoreVertical className="h-5 w-5 text-slate-500" /></Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2"
        style={{ backgroundImage: 'radial-gradient(#00000010 1px, transparent 0)', backgroundSize: '20px 20px' }}
      >
        {messages.map((m, idx) => {
          const isMe = m.sender._id === user._id;
          const showSender = !isMe && (!messages[idx - 1] || messages[idx - 1].sender._id !== m.sender._id);
          return (
            <div key={m._id} className={cn('flex w-full mb-1', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'relative max-w-[92%] sm:max-w-[85%] rounded-lg px-3 py-1.5 shadow-sm',
                isMe ? 'bg-[#dcf8c6] dark:bg-emerald-900/80 rounded-tr-none' : 'bg-white dark:bg-slate-800 rounded-tl-none'
              )}>
                {showSender && <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">{m.sender.name}</p>}
                {m.attachments?.map((att, i) => <img key={i} src={att} className="max-w-full rounded mb-1 max-h-60 object-cover" />)}
                <div className="flex flex-wrap items-end gap-2">
                  <p className="text-[14px] text-slate-800 dark:text-slate-100 leading-normal">{m.message}</p>
                  <div className="ml-auto flex items-center gap-1 pt-1">
                    <span className="text-[9px] text-slate-400">{formatTime(m.createdAt)}</span>
                    {isMe && <CheckCheck className="h-3 w-3 text-blue-500" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => send(e)} className="flex items-center gap-2 bg-[#f0f2f5] dark:bg-slate-900 px-4 py-3 border-t dark:border-slate-800">
        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
        <Button type="button" variant="ghost" className="rounded-full p-2 text-slate-500" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
        <input
          placeholder="Type a message"
          className="flex-1 rounded-lg bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:outline-none dark:text-white"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim() && !sending} className={cn("flex h-10 w-10 items-center justify-center rounded-full", text.trim() ? "bg-emerald-600 text-white" : "text-slate-400")}><Send className="h-5 w-5" /></button>
      </form>
    </div>
  );
}

export default function Complaints() {
  const { user } = useAuth();
  const dateFormat = user?.company?.settings?.dateFormat || 'BS';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('CHAT'); // CHAT | COMPLAINT
  const [modal, setModal] = useState({ open: false, mode: 'CHAT' });

  // Persistent read status tracking map: { [itemId]: isoTimestamp }
  const [readMap, setReadMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bs_chat_read_map') || '{}');
    } catch {
      return {};
    }
  });

  const markAsRead = useCallback((itemId) => {
    setReadMap(prev => {
      const updated = { ...prev, [itemId]: new Date().toISOString() };
      try {
        localStorage.setItem('bs_chat_read_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleSelect = (item) => {
    markAsRead(item._id);
    setSelected(item);
  };

  const handleTestPush = async () => {
    try {
      const { data } = await api.post('/auth/test-push');
      alert(data.message || 'Test notification sent!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not send test push notification');
    }
  };

  const load = useCallback(async () => {
    try {
      const endpoint = tab === 'CHAT' ? '/chats' : '/complaints';
      const { data } = await api.get(endpoint);
      setData(data.data);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && data.length === 0) return <Spinner />;

  if (selected) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 lg:relative lg:inset-auto lg:h-full lg:rounded-xl lg:overflow-hidden lg:shadow-xl lg:border dark:border-slate-800">
        <ChatView item={selected} mode={tab} onBack={() => setSelected(null)} onRead={markAsRead} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => { setTab('CHAT'); setLoading(true); }}
            className={cn("flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all", tab === 'CHAT' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-slate-500")}
          >
            Chat
          </button>
          <button
            onClick={() => { setTab('COMPLAINT'); setLoading(true); }}
            className={cn("flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all", tab === 'COMPLAINT' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-slate-500")}
          >
            Complaint
          </button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-slate-500" title="Test Push Notification" onClick={handleTestPush}>
            <Bell className="h-4 w-4 mr-1 text-blue-600" /> Test Push
          </Button>
          <Button size="sm" variant="outline" className="flex-1 bg-white sm:flex-none" onClick={() => setModal({ open: true, mode: 'CHAT' })}>
            <MessageSquare className="h-4 w-4 mr-1" /> New Chat
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setModal({ open: true, mode: 'COMPLAINT' })}>
            <Plus className="h-4 w-4 mr-1" /> Add Complaint
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden divide-y dark:divide-slate-800">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
            <p>No {tab.toLowerCase()}s yet</p>
          </div>
        ) : data.map((c) => {
          // Determine if this item has an unread message from another user
          const isUnread = Boolean(
            c.lastMessage &&
            c.lastMessageSender &&
            c.lastMessageSender._id !== user._id &&
            (!readMap[c._id] || new Date(readMap[c._id]) < new Date(c.lastMessageAt || c.updatedAt))
          );

          return (
            <div
              key={c._id}
              onClick={() => handleSelect(c)}
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition",
                isUnread && "bg-blue-50/60 dark:bg-blue-950/20"
              )}
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold text-lg uppercase">
                {c.isGroup ? <Users className="h-6 w-6" /> : (c.recipient?.name?.[0] || 'U')}
                {isUnread && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white dark:border-slate-900"></span>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={cn(
                    "text-sm truncate",
                    isUnread ? "font-extrabold text-slate-900 dark:text-white" : "font-semibold text-slate-800 dark:text-slate-200"
                  )}>
                     {tab === 'CHAT' && !c.isGroup ? (c.recipient?.name || 'User') : (c.subject || c.groupName)}
                     {isUnread && (
                       <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                         Unread
                       </span>
                     )}
                  </h3>
                  <span className={cn("text-[10px]", isUnread ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-400")}>
                    {formatDate(c.lastMessageAt || c.updatedAt, dateFormat)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm truncate pr-4",
                    isUnread ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 font-normal"
                  )}>
                    {c.lastMessageSender && <span className={cn("mr-1", isUnread ? "font-bold text-blue-700 dark:text-blue-300" : "font-semibold text-slate-400")}>{c.lastMessageSender._id === user._id ? 'You:' : `${c.lastMessageSender.name}:`}</span>}
                    {c.lastMessage || c.message}
                  </p>
                  <Badge color={c.isGroup ? "gray" : "blue"} className="text-[9px] uppercase font-bold tracking-wider">
                    {c.isGroup ? 'GROUP' : (c.recipient?.name || 'Manager')}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      <ConversationModal
        open={modal.open}
        mode={modal.mode}
        onClose={() => setModal({ ...modal, open: false })}
        onSuccess={load}
      />
    </div>
  );
}
