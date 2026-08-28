import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { siteConfig } from '../../config/site';

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
    <div className="pt-20">
      <section className="bg-slate-50 py-24">
        <div className="section-container text-center max-w-3xl">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-6">
            Simple, Transparent <span className="text-primary-600">Pricing</span>
          </h1>
          <p className="lead text-lg mb-10">
            Choose the plan that fits your business stage. No hidden fees.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${isYearly ? 'translate-x-7' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
              Yearly <span className="text-emerald-500 font-bold ml-1">(Save 15%)</span>
            </span>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                  tier.featured
                    ? 'border-primary-600 shadow-xl shadow-primary-500/10 scale-105 z-10 bg-white'
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}
              >
                {tier.featured && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </span>
                )}

                <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                <p className="text-slate-500 text-sm mb-6 min-h-[40px]">{tier.desc}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-slate-900">NPR {isYearly ? tier.price.yearly : tier.price.monthly}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>

                <a
                  href={siteConfig.links.register}
                  className={`btn w-full py-4 mb-8 ${tier.featured ? 'btn-primary' : 'btn-outline border-slate-300'}`}
                >
                  {tier.cta}
                </a>

                <ul className="space-y-4">
                  {tier.features.map((f) => (
                    <li key={f.name} className="flex items-start gap-3">
                      {f.included ? (
                        <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 shrink-0" />
                      )}
                      <span className={`text-sm ${f.included ? 'text-slate-700' : 'text-slate-400'}`}>{f.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
