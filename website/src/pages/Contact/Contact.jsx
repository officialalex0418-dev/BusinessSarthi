import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare } from 'lucide-react';
import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';

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
    <div className="pt-32 pb-24 relative overflow-hidden">
      <section className="py-40 relative z-10">
        <div className="section-container text-center max-w-5xl relative">
          <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float border-4 border-white/10">
             <MessageSquare className="h-10 w-10" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 sm:text-9xl mb-8 tracking-tighter leading-[0.85]">
            Let's Start a <br /><span className="text-primary-600 italic">Conversation.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto font-medium">
            Have questions about digitalizing your operations? Our team is here to
            help you find the right solution for your unique business needs.
          </p>
        </div>
      </section>

      <section className="py-32 relative z-10">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-24">
            {/* Info */}
            <div className="lg:col-span-5 space-y-12">
              <div>
                <h3 className="text-3xl font-black text-slate-900 mb-10 uppercase tracking-tighter italic">Get In Touch</h3>
                <div className="space-y-10">
                  <div className="flex items-start gap-8 group">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary-200">
                      <Mail className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Email Address</p>
                      <a href={`mailto:${siteConfig.contact.email}`} className="text-2xl font-black text-slate-700 hover:text-primary-600 transition-colors tracking-tight">{siteConfig.contact.email}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-8 group">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary-200">
                      <Phone className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Phone Number</p>
                      <a href={`tel:${siteConfig.contact.phone}`} className="text-2xl font-black text-slate-700 hover:text-primary-600 transition-colors tracking-tight">{siteConfig.contact.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-8 group">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary-200">
                      <MapPin className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Office Location</p>
                      <p className="text-2xl font-black text-slate-700 tracking-tight">{siteConfig.contact.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <ThreeDCard intensity={5}>
                <div className="p-12 rounded-[4rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl group border border-white/5">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600/20 rounded-full blur-[80px]" />
                   <h4 className="text-3xl font-black mb-6 italic text-primary-400 tracking-tighter uppercase">Request a Demo</h4>
                   <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed">Want to see Business Sarthi in action? Our experts can provide a personalized walkthrough of our modules.</p>
                   <a href={siteConfig.links.register} className="inline-flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-white border-b-2 border-primary-500 pb-2 hover:gap-6 transition-all">Schedule Now →</a>
                </div>
              </ThreeDCard>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <ThreeDCard intensity={2}>
                 <div className="bg-white/80 backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border border-slate-100 shadow-3d relative overflow-hidden">
                   {status === 'success' ? (
                     <div className="text-center py-20 animate-fade-in">
                       <div className="h-28 w-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-10 shadow-inner">
                         <Send className="h-12 w-12" />
                       </div>
                       <h3 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Message Received!</h3>
                       <p className="text-slate-500 text-lg font-medium mb-12 max-w-sm mx-auto">Thank you for reaching out. We will get back to you within 24 hours.</p>
                       <button onClick={() => setStatus('idle')} className="w-full py-6 rounded-3xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-2xl">Send Another</button>
                     </div>
                   ) : (
                     <form onSubmit={handleSubmit} className="space-y-10">
                       <div className="grid md:grid-cols-2 gap-10">
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Full Name</label>
                           <input
                             type="text" required value={form.name}
                             onChange={e => setForm({...form, name: e.target.value})}
                             className="w-full px-8 py-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-8 focus:ring-primary-50 transition-all bg-slate-50/50 font-black text-lg"
                             placeholder="Laxmi Sah"
                           />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Work Email</label>
                           <input
                             type="email" required value={form.email}
                             onChange={e => setForm({...form, email: e.target.value})}
                             className="w-full px-8 py-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-8 focus:ring-primary-50 transition-all bg-slate-50/50 font-black text-lg"
                             placeholder="laxmi@company.com"
                           />
                         </div>
                       </div>

                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Subject</label>
                         <input
                           type="text" required value={form.subject}
                           onChange={e => setForm({...form, subject: e.target.value})}
                           className="w-full px-8 py-5 rounded-[1.5rem] border border-slate-100 focus:outline-none focus:ring-8 focus:ring-primary-50 transition-all bg-slate-50/50 font-black text-lg"
                           placeholder="How can we assist you?"
                         />
                       </div>

                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Your Message</label>
                         <textarea
                           required value={form.message}
                           onChange={e => setForm({...form, message: e.target.value})}
                           rows={5}
                           className="w-full px-8 py-5 rounded-[2rem] border border-slate-100 focus:outline-none focus:ring-8 focus:ring-primary-50 transition-all bg-slate-50/50 font-black text-lg resize-none"
                           placeholder="Describe your requirements..."
                         />
                       </div>

                       <button type="submit" disabled={status === 'loading'} className="w-full py-6 rounded-[2rem] bg-primary-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary-200 hover:scale-[1.02] active:scale-95 transition-all">
                         {status === 'loading' ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'Dispatch Message'}
                       </button>

                       {status === 'error' && (
                         <div className="p-6 rounded-[2rem] bg-red-50 border border-red-100 text-center animate-shake">
                           <p className="text-red-600 font-black uppercase tracking-widest text-xs">Submission Failed</p>
                           <p className="text-red-500 text-[10px] mt-1 font-bold">{errorMsg}</p>
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
