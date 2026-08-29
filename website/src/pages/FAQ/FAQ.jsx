import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, Shield, Zap, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';
import ThreeDBackground from '../../components/common/ThreeDBackground';
import ThreeDCard from '../../components/common/ThreeDCard';

const faqs = [
  {
    q: 'What is Business Sarthi?',
    a: 'Business Sarthi is an all-in-one business management and workforce intelligence platform designed to help companies digitalize their people, sales, and operations in one connected environment.',
    icon: Globe
  },
  {
    q: 'Who is this platform for?',
    a: 'It is built for modern businesses of all sizes—from growing startups to large enterprises with field staff, sales teams, and complex supply chain operations.',
    icon: Sparkles
  },
  {
    q: 'Does it support GPS tracking?',
    a: 'Yes, Business Sarthi features a robust real-time GPS tracking system for field staff, including route playback, movement analysis, and geofenced attendance.',
    icon: Zap
  },
  {
    q: 'How does the payroll system work?',
    a: 'The system automatically generates payroll based on attendance data, basic salary settings, allowances, and deductions. You can generate professional payslips with a single click.',
    icon: Sparkles
  },
  {
    q: 'Is my business data secure?',
    a: 'Absolutely. We use strict multi-tenant isolation, JWT-based authentication, and granular RBAC (Role-Based Access Control) to ensure your data is isolated and protected.',
    icon: Shield
  },
  {
    q: 'Can I manage my inventory?',
    a: 'Yes, the platform includes a comprehensive inventory module where you can track products, SKUs, stock movements, and receive low-stock alerts.',
    icon: Globe
  }
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="pt-32 pb-24 relative overflow-hidden">
      <section className="py-32 relative z-10">
        <div className="section-container text-center max-w-5xl relative">
          <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float border-4 border-white/10">
             <HelpCircle className="h-10 w-10" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 sm:text-8xl mb-8 tracking-tighter leading-[0.9]">
            Frequently Asked <br /><span className="text-primary-600 italic">Questions.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto">
            Everything you need to know about Business Sarthi and how it can help your organization scale.
          </p>
        </div>
      </section>

      <section className="py-32 relative z-10">
        <div className="section-container grid lg:grid-cols-12 gap-20">
           {/* FAQ Content */}
           <div className="lg:col-span-8 space-y-6">
              {faqs.map((faq, i) => (
                <ThreeDCard key={i} intensity={2}>
                   <div className={cn(
                     "border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl transition-all duration-500",
                     open === i ? "shadow-3d border-primary-100" : "hover:shadow-xl hover:border-primary-100"
                   )}>
                      <button
                        onClick={() => setOpen(open === i ? null : i)}
                        className="w-full px-10 py-8 flex items-center justify-between text-left group"
                      >
                         <div className="flex items-center gap-6">
                            <div className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                              open === i ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-600 group-hover:scale-110"
                            )}>
                               <faq.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-black text-slate-800 tracking-tight">{faq.q}</span>
                         </div>
                         <ChevronDown className={cn("h-6 w-6 text-slate-300 transition-transform duration-500", open === i && "rotate-180 text-primary-600")} />
                      </button>
                      <div className={cn(
                        "px-10 overflow-hidden transition-all duration-500 ease-in-out",
                        open === i ? "max-h-96 pb-10" : "max-h-0"
                      )}>
                         <div className="pl-[72px]">
                            <p className="text-slate-500 text-lg font-medium leading-relaxed">{faq.a}</p>
                         </div>
                      </div>
                   </div>
                </ThreeDCard>
              ))}
           </div>

           {/* Side Decorative / Info */}
           <div className="lg:col-span-4 space-y-8">
              <ThreeDCard intensity={5}>
                 <div className="p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl" />
                    <h4 className="text-2xl font-black mb-6 italic text-primary-400 uppercase tracking-tighter">Still have questions?</h4>
                    <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                       Our support team is available 24/7 to help you with any technical or business related queries.
                    </p>
                    <a href="/contact" className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white border-b-2 border-primary-500 pb-1 hover:gap-5 transition-all">
                       Chat with us →
                    </a>
                 </div>
              </ThreeDCard>

              <div className="p-10 rounded-[3rem] border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
                 <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary-600 mb-6">
                    <Shield className="h-8 w-8" />
                 </div>
                 <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Secure & Private</h5>
                 <p className="text-slate-500 text-sm font-medium">Your business data is 100% isolated and encrypted.</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
