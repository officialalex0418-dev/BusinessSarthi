import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { siteConfig } from '../../config/site';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="pt-20">
      <section className="bg-slate-50 py-24">
        <div className="section-container text-center max-w-3xl">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-6">
            Get in <span className="text-primary-600">Touch</span>
          </h1>
          <p className="lead text-lg">
            Have questions about Business Sarthi? Our team is here to help you find the right solution
            for your business.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Info */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Email Us</p>
                      <a href={`mailto:${siteConfig.contact.email}`} className="text-slate-500 hover:text-primary-600">{siteConfig.contact.email}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Call Us</p>
                      <a href={`tel:${siteConfig.contact.phone}`} className="text-slate-500 hover:text-primary-600">{siteConfig.contact.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Our Office</p>
                      <p className="text-slate-500">{siteConfig.contact.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900 text-white">
                 <h4 className="font-bold mb-2">Request a Demo</h4>
                 <p className="text-slate-400 text-sm mb-6">Want to see Business Sarthi in action? Our experts can provide a personalized walkthrough.</p>
                 <a href={siteConfig.links.register} className="text-primary-400 font-bold hover:underline">Schedule Now →</a>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                      <Send className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent Successfully!</h3>
                    <p className="text-slate-500 mb-8">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                    <button onClick={() => setStatus('idle')} className="btn btn-primary px-8">Send Another Message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Full Name</label>
                        <input
                          type="text" required value={form.name}
                          onChange={e => setForm({...form, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/50"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Work Email</label>
                        <input
                          type="email" required value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/50"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Phone Number</label>
                        <input
                          type="tel" value={form.phone}
                          onChange={e => setForm({...form, phone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/50"
                          placeholder="+977-9800000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Company Name</label>
                        <input
                          type="text" value={form.company}
                          onChange={e => setForm({...form, company: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/50"
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Subject</label>
                      <input
                        type="text" required value={form.subject}
                        onChange={e => setForm({...form, subject: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/50"
                        placeholder="How can we help?"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Message</label>
                      <textarea
                        required value={form.message}
                        onChange={e => setForm({...form, message: e.target.value})}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/50"
                        placeholder="Tell us more about your requirements..."
                      />
                    </div>
                    <button type="submit" disabled={status === 'loading'} className="btn btn-primary w-full py-4 gap-3 text-lg">
                      {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
