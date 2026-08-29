import { Users, TrendingUp, Boxes, Truck, Building2, Store } from 'lucide-react';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';

const solutions = [
  {
    title: 'For Growing Businesses',
    desc: 'Digitalize your entire operations from people to payroll. Scale with confidence using cloud-native tools.',
    icon: Building2,
    color: 'bg-blue-600'
  },
  {
    title: 'For Sales Teams',
    desc: 'Real-time target tracking and performance analytics. Empower your field force to sell more with data.',
    icon: TrendingUp,
    color: 'bg-emerald-600'
  },
  {
    title: 'For Field Operations',
    desc: 'Biometric-grade GPS attendance and movement heatmaps. Know exactly where your team is and what they do.',
    icon: Users,
    color: 'bg-indigo-600'
  },
  {
    title: 'For Distributors',
    desc: 'Manage your distribution network, ledgers, and transactions in one synchronized environment.',
    icon: Truck,
    color: 'bg-orange-600'
  },
  {
    title: 'For Vendor Management',
    desc: 'Maintain supplier records, purchase history, and outstanding balances with absolute precision.',
    icon: Building2,
    color: 'bg-purple-600'
  },
  {
    title: 'For Retail Operations',
    desc: 'Synchronized inventory and stock alerts. Never run out of your best-selling products again.',
    icon: Store,
    color: 'bg-rose-600'
  }
];

export default function Solutions() {
  return (
    <div className="pt-32 pb-24 relative overflow-hidden">
      <section className="py-40 relative z-10">
        <div className="section-container text-center max-w-6xl relative">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-600 mb-6">Industrial Solutions</p>
          <h1 className="text-5xl font-black text-slate-900 sm:text-9xl mb-8 tracking-tighter leading-[0.85]">
            Built For <br /><span className="text-primary-600 italic">How You Work.</span>
          </h1>
          <p className="lead max-w-3xl mx-auto text-slate-500 font-medium">
            Business Sarthi provides tailored modules designed to solve the unique operational
            challenges of modern organizations.
          </p>
        </div>
      </section>

      <section className="py-32 relative z-10">
        <div className="section-container">
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {solutions.map((s, i) => (
                <ThreeDCard key={i} intensity={10} className="h-full">
                   <div className="bg-white/80 backdrop-blur-xl h-full p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-3d transition-all duration-500 group relative overflow-hidden">
                      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-[6] transition-transform duration-700" />

                      <div className="relative z-10">
                         <div className={`h-16 w-16 rounded-2xl ${s.color} text-white flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <s.icon className="h-8 w-8" />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-tight">{s.title}</h3>
                         <p className="text-slate-500 text-lg font-medium leading-relaxed">{s.desc}</p>
                      </div>
                   </div>
                </ThreeDCard>
              ))}
           </div>
        </div>
      </section>

      <section className="py-40 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-grid opacity-[0.03]" />
         <div className="section-container text-center max-w-4xl relative z-10">
            <h2 className="text-4xl font-black sm:text-7xl mb-10 tracking-tighter uppercase">Unified Business Intelligence.</h2>
            <p className="text-slate-400 text-xl mb-12 leading-relaxed font-medium">
               No more disconnected silos. Business Sarthi brings your entire business
               ecosystem into one secure, real-time platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
               <a href="/contact" className="btn btn-primary px-12 py-6 rounded-[2rem]">Contact Architecture Team</a>
               <a href="/pricing" className="btn btn-outline border-white/10 text-white hover:bg-white/5 px-12 py-6 rounded-[2rem]">View Platform Tiers</a>
            </div>
         </div>
      </section>
    </div>
  );
}
