import { useState } from 'react';
import { Check, X, Zap, Crown } from 'lucide-react';
import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';
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
    <div className="pt-32 pb-24 relative overflow-hidden">
      <section className="py-40 relative z-10">
        <div className="section-container !max-w-full text-center max-w-5xl relative">
          <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float border-4 border-white/10">
             <Crown className="h-10 w-10" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-600 mb-6">Investment Tiers</p>
          <h1 className="text-5xl font-black text-slate-900 sm:text-[10rem] mb-12 tracking-tighter leading-[0.85] uppercase italic">
            Scale <br /><span className="text-primary-600 not-italic">Smart.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto font-medium lg:text-3xl text-slate-400">
            Professional solutions for every stage of your business growth.
            Zero hidden costs. 100% Transparency.
          </p>

          <div className="mt-20 inline-flex items-center gap-4 p-3 rounded-[2.5rem] bg-white shadow-2xl border border-slate-100">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                !isYearly ? "bg-primary-600 text-white shadow-xl" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Billing Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
                isYearly ? "bg-primary-600 text-white shadow-xl" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Billing Yearly
              <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-black animate-pulse">SAVE 15%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="py-32 relative z-10">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {tiers.map((tier) => (
              <ThreeDCard key={tier.name} intensity={tier.featured ? 20 : 10}>
                <div
                  className={cn(
                    "relative p-12 lg:p-20 rounded-[5rem] border transition-all duration-700 h-full flex flex-col group overflow-hidden",
                    tier.featured
                      ? 'border-primary-600 shadow-3d-hover bg-white z-10'
                      : 'border-slate-100 bg-white/60 backdrop-blur-xl hover:bg-white hover:border-slate-200 shadow-sm'
                  )}
                >
                  {tier.featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-10 py-3 bg-primary-600 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl whitespace-nowrap">
                      Enterprise Choice
                    </div>
                  )}

                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-[80px] group-hover:bg-primary-600/10 transition-colors" />

                  <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic leading-none">{tier.name}</h3>
                  <p className="text-slate-400 text-base font-medium mb-12 min-h-[40px] leading-relaxed italic">{tier.desc}</p>

                  <div className="flex items-baseline gap-3 mb-16">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">NPR</span>
                    <span className="text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-none">
                       {isYearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className="text-slate-400 text-base font-black lowercase tracking-tighter">/mo</span>
                  </div>

                  <a
                    href={siteConfig.links.register}
                    className={cn(
                      "w-full py-8 rounded-[2rem] mb-16 text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl",
                      tier.featured
                        ? 'bg-primary-600 text-white shadow-primary-200 hover:scale-[1.03] active:scale-95'
                        : 'bg-slate-900 text-white hover:bg-primary-600'
                    )}
                  >
                    {tier.cta}
                  </a>

                  <div className="space-y-8 flex-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] mb-8">Standard Deployment</p>
                    {tier.features.map((f) => (
                      <div key={f.name} className="flex items-center gap-6 group/item">
                        <div className={cn(
                          "h-7 w-7 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover/item:scale-125 group-hover/item:rotate-12",
                          f.included ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-300 opacity-50'
                        )}>
                           {f.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                          "text-lg font-bold tracking-tight transition-colors duration-500",
                          f.included ? 'text-slate-700 group-hover/item:text-slate-900' : 'text-slate-300 line-through decoration-2'
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
    </div>
  );
}
