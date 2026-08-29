import { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';
import { cn } from '../../utils/cn';

const tiers = [
  {
    name: 'Starter',
    price: { monthly: '2,999', yearly: '2,499' },
    desc: 'Perfect for small teams getting started with digitalization.',
    features: [
      { name: 'Up to 10 employees', included: true },
      { name: 'GPS Attendance', included: true },
      { name: 'Basic Reporting', included: true },
      { name: 'Sales Entry', included: true },
      { name: 'Inventory Management', included: false },
      { name: 'Payroll Automation', included: false },
    ],
    cta: 'Start Free Trial',
    featured: false,
  },
  {
    name: 'Growth',
    price: { monthly: '7,999', yearly: '6,999' },
    desc: 'Enhanced capabilities for growing teams and field operations.',
    features: [
      { name: 'Up to 50 employees', included: true },
      { name: 'Live GPS Tracking', included: true },
      { name: 'Inventory & Distributors', included: true },
      { name: 'Leave Management', included: true },
      { name: 'Payroll Automation', included: true },
      { name: 'Priority Support', included: false },
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: '19,999', yearly: '16,999' },
    desc: 'Custom solutions for large organizations with complex needs.',
    features: [
      { name: 'Up to 500 employees', included: true },
      { name: 'Full Performance Suite', included: true },
      { name: 'Advanced API Access', included: true },
      { name: 'Custom Integrations', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: '99.9% Uptime SLA', included: true },
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="pt-32 pb-24">
      <section className="bg-slate-50 py-32 overflow-hidden relative">
        <div className="section-container text-center max-w-3xl relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary-600 shadow-xl flex items-center justify-center text-white mx-auto mb-8 animate-float">
             <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 sm:text-6xl mb-8 tracking-tight leading-tight">
            Simple, Transparent <span className="text-primary-600 italic">Pricing</span>
          </h1>
          <p className="lead mb-12">
            Choose the plan that fits your business stage. No hidden fees.
            No implementation costs.
          </p>

          <div className="inline-flex items-center gap-4 p-2 rounded-2xl bg-white shadow-sm border border-slate-100">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                !isYearly ? "bg-primary-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                isYearly ? "bg-primary-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Yearly
              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black">-15%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="py-32">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {tiers.map((tier) => (
              <ThreeDCard key={tier.name} intensity={tier.featured ? 10 : 5}>
                <div
                  className={cn(
                    "relative p-10 rounded-[3rem] border transition-all duration-500 h-full flex flex-col",
                    tier.featured
                      ? 'border-primary-600 shadow-3d-hover bg-white z-10'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                  )}
                >
                  {tier.featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-1.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">
                      Recommended
                    </div>
                  )}

                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{tier.name}</h3>
                  <p className="text-slate-400 text-sm font-medium mb-10 min-h-[40px] leading-relaxed">{tier.desc}</p>

                  <div className="flex items-baseline gap-2 mb-10">
                    <span className="text-sm font-bold text-slate-400 uppercase">NPR</span>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                       {isYearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className="text-slate-400 text-sm font-bold lowercase">/mo</span>
                  </div>

                  <a
                    href={siteConfig.links.register}
                    className={cn(
                      "btn w-full py-5 rounded-2xl mb-10 text-lg font-black transition-all shadow-lg",
                      tier.featured
                        ? 'btn-primary shadow-primary-200 hover:scale-[1.02]'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    )}
                  >
                    {tier.cta}
                  </a>

                  <div className="space-y-5 flex-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">What's Included</p>
                    {tier.features.map((f) => (
                      <div key={f.name} className="flex items-center gap-3">
                        {f.included ? (
                          <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                             <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                             <X className="h-3 w-3 text-slate-300" />
                          </div>
                        )}
                        <span className={cn(
                          "text-sm font-semibold tracking-tight",
                          f.included ? 'text-slate-700' : 'text-slate-300'
                        )}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ThreeDCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
