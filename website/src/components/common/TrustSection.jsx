import { Shield, Cloud, Zap, Scale, Users2, Database } from 'lucide-react';

const indicators = [
  { name: 'Enterprise Secure', icon: Shield, color: 'text-blue-500 bg-blue-50' },
  { name: 'Cloud Native', icon: Cloud, color: 'text-sky-500 bg-sky-50' },
  { name: 'Real-time Intel', icon: Zap, color: 'text-amber-500 bg-amber-50' },
  { name: 'Highly Scalable', icon: Scale, color: 'text-emerald-500 bg-emerald-50' },
  { name: 'Multi-tenant', icon: Database, color: 'text-indigo-500 bg-indigo-50' },
  { name: 'Human Centric', icon: Users2, color: 'text-rose-500 bg-rose-50' },
];

export default function TrustSection() {
  return (
    <section className="py-20 border-y border-slate-100 bg-slate-50/30">
      <div className="section-container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="text-center lg:text-left">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Platform Integrity</p>
             <h3 className="text-xl font-black text-slate-900 italic">Built for modern <br />enterprises.</h3>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {indicators.map((item) => (
              <div key={item.name} className="flex flex-col items-center lg:items-start gap-4 group cursor-default">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight text-center lg:text-left">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
