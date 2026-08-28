import { Shield, Cloud, Zap, Scale, Users2, Database } from 'lucide-react';

const indicators = [
  { name: 'Enterprise Secure', icon: Shield },
  { name: 'Cloud Based', icon: Cloud },
  { name: 'Real-time Analytics', icon: Zap },
  { name: 'Highly Scalable', icon: Scale },
  { name: 'Multi-tenant', icon: Database },
  { name: 'User Friendly', icon: Users2 },
];

export default function TrustSection() {
  return (
    <section className="py-12 border-y border-slate-100 bg-slate-50/50">
      <div className="section-container">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400 mb-10">
          Built for modern businesses
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {indicators.map((item) => (
            <div key={item.name} className="flex flex-col items-center gap-3 group transition-all duration-300 hover:-translate-y-1">
              <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <item.icon className="h-5 w-5 text-slate-400 group-hover:text-primary-600" />
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
