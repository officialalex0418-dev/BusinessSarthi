import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare } from 'lucide-react';
import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${siteConfig.apiUrl}/public/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          companyName: form.company,
          subject: form.subject,
          message: form.message
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.message || `Server responded with ${res.status}`);
      }
    } catch (err) {
      console.error('Inquiry error:', err);
      setStatus('error');
      setErrorMsg('Network error. Is the backend server running?');
    }
  };

  return (
    <div className="pt-32 pb-24">
      <section className="bg-slate-50 py-32 overflow-hidden relative">
        <div className="section-container text-center max-w-4xl relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary-600 shadow-xl flex items-center justify-center text-white mx-auto mb-8 animate-float">
             <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 sm:text-7xl mb-8 tracking-tight leading-tight">
            Let's Start a <span className="text-primary-600 italic">Conversation.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto">
            Have questions about digitalizing your operations? Our team is here to
            help you find the right solution for your unique business needs.
          </p>
        </div>
      </section>

      <section className="py-32">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-20">
            {/* Info */}
            <div className="lg:col-span-5 space-y-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Contact Information</h3>
                <div className="space-y-8">
                  <div className="flex items-start gap-6 group">
                    <div className="p-4 rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                      <a href={`mailto:${siteConfig.contact.email}`} className="text-lg font-bold text-slate-700 hover:text-primary-600 transition-colors">{siteConfig.contact.email}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 group">
                    <div className="p-4 rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Call Us</p>
                      <a href={`tel:${siteConfig.contact.phone}`} className="text-lg font-bold text-slate-700 hover:text-primary-600 transition-colors">{siteConfig.contact.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 group">
                    <div className="p-4 rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Our Office</p>
                      <p className="text-lg font-bold text-slate-700">{siteConfig.contact.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <ThreeDCard intensity={5}>
                <div className="p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl" />
                   <h4 className="text-xl font-black mb-4 italic text-primary-400">Request a Product Demo</h4>
                   <p className="text-slate-400 font-medium mb-8 leading-relaxed">Want to see Business Sarthi in action? Our experts can provide a personalized walkthrough of the dashboard and field tools.</p>
                   <a href={siteConfig.links.register} className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white border-b-2 border-primary-500 pb-1 hover:gap-4 transition-all">Schedule Now →</a>
                </div>
              </ThreeDCard>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <ThreeDCard intensity={2}>
                 <div className="bg-white p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-3d relative overflow-hidden">
                   {status === 'success' ? (
                     <div className="text-center py-20 animate-fade-in">
                       <div className="h-24 w-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-inner">
                         <Send className="h-10 w-10" />
                       </div>
                       <h3 className="text-3xl font-black text-slate-900 mb-4">Message Sent!</h3>
                       <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Thank you for reaching out. Our team will review your inquiry and get back to you within 24 hours.</p>
                       <button onClick={() => setStatus('idle')} className="btn btn-primary px-10 py-4 rounded-full font-black">Send Another Message</button>
                     </div>
                   ) : (
                     <form onSubmit={handleSubmit} className="space-y-8">
                       <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                           <input
                             type="text" required value={form.name}
                             onChange={e => setForm({...form, name: e.target.value})}
                             className="w-full px-6 py-4 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all bg-slate-50/50 font-bold"
                             placeholder="Laxmi Sah"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Work Email</label>
                           <input
                             type="email" required value={form.email}
                             onChange={e => setForm({...form, email: e.target.value})}
                             className="w-full px-6 py-4 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all bg-slate-50/50 font-bold"
                             placeholder="laxmi@company.com"
                           />
                         </div>
                       </div>
                       <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                           <input
                             type="tel" value={form.phone}
                             onChange={e => setForm({...form, phone: e.target.value})}
                             className="w-full px-6 py-4 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all bg-slate-50/50 font-bold"
                             placeholder="+977-..."
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Company Name</label>
                           <input
                             type="text" value={form.company}
                             onChange={e => setForm({...form, company: e.target.value})}
                             className="w-full px-6 py-4 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all bg-slate-50/50 font-bold"
                             placeholder="Your Enterprise Inc."
                           />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                         <input
                           type="text" required value={form.subject}
                           onChange={e => setForm({...form, subject: e.target.value})}
                           className="w-full px-6 py-4 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all bg-slate-50/50 font-bold"
                           placeholder="How can we assist you?"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Message</label>
                         <textarea
                           required value={form.message}
                           onChange={e => setForm({...form, message: e.target.value})}
                           rows={5}
                           className="w-full px-6 py-4 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all bg-slate-50/50 font-bold resize-none"
                           placeholder="Describe your requirements..."
                         />
                       </div>

                       <button type="submit" disabled={status === 'loading'} className="btn btn-primary w-full py-5 rounded-2xl gap-3 text-lg font-black shadow-2xl shadow-primary-200 hover:scale-[1.02]">
                         {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Your Inquiry'}
                       </button>

                       {status === 'error' && (
                         <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-center animate-shake">
                           <p className="text-red-600 text-sm font-bold">Inquiry Failed</p>
                           <p className="text-red-500 text-xs mt-1 font-medium">{errorMsg}</p>
                         </div>
                       )}
                     </form>
                   )}
                 </div>
              </ThreeDCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
