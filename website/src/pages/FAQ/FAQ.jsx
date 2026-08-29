import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const faqs = [
  {
    q: 'What is Business Sarthi?',
    a: 'Business Sarthi is an all-in-one business management and workforce intelligence platform designed to help companies digitalize their people, sales, and operations in one connected environment.'
  },
  {
    q: 'Who is this platform for?',
    a: 'It is built for modern businesses of all sizes—from growing startups to large enterprises with field staff, sales teams, and complex supply chain operations.'
  },
  {
    q: 'Does it support GPS tracking?',
    a: 'Yes, Business Sarthi features a robust real-time GPS tracking system for field staff, including route playback, movement analysis, and geofenced attendance.'
  },
  {
    q: 'How does the payroll system work?',
    a: 'The system automatically generates payroll based on attendance data, basic salary settings, allowances, and deductions. You can generate professional payslips with a single click.'
  },
  {
    q: 'Is my business data secure?',
    a: 'Absolutely. We use strict multi-tenant isolation, JWT-based authentication, and granular RBAC (Role-Based Access Control) to ensure your data is isolated and protected.'
  },
  {
    q: 'Can I manage my inventory?',
    a: 'Yes, the platform includes a comprehensive inventory module where you can track products, SKUs, stock movements, and receive low-stock alerts.'
  }
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="pt-32 pb-24">
      <section className="bg-slate-50 py-32 overflow-hidden relative">
        <div className="section-container text-center max-w-3xl relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary-600 shadow-xl flex items-center justify-center text-white mx-auto mb-8 animate-float">
             <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 sm:text-6xl mb-8 tracking-tight">
            Frequently Asked <span className="text-primary-600 italic">Questions</span>
          </h1>
          <p className="lead">
            Everything you need to know about Business Sarthi and how it can help your organization scale.
          </p>
        </div>
      </section>

      <section className="py-32">
        <div className="section-container max-w-3xl">
           <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                   <button
                     onClick={() => setOpen(open === i ? null : i)}
                     className="w-full px-8 py-6 flex items-center justify-between text-left group"
                   >
                      <span className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{faq.q}</span>
                      <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-300", open === i && "rotate-180")} />
                   </button>
                   <div className={cn(
                     "px-8 overflow-hidden transition-all duration-300 ease-in-out",
                     open === i ? "max-h-48 pb-8" : "max-h-0"
                   )}>
                      <p className="text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
