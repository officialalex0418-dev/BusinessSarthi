import Hero from '../../components/hero/Hero';
import FeatureGrid from '../../components/features/FeatureGrid';
import Ecosystem from '../../components/common/Ecosystem';
import TrustSection from '../../components/common/TrustSection';
import CTASection from '../../components/cta/CTASection';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, Boxes, ShieldCheck, Zap } from 'lucide-react';

const solutions = [
  {
    title: 'Workforce Intelligence',
    desc: 'GPS-verified attendance and real-time movement analysis.',
    icon: Users,
    to: '/features#people',
    color: 'bg-blue-600'
  },
  {
    title: 'Sales Performance',
    desc: 'Target tracking and achievement analytics for field teams.',
    icon: TrendingUp,
    to: '/features#sales',
    color: 'bg-emerald-600'
  },
  {
    title: 'Operations & Stock',
    desc: 'Synchronized inventory, vendor ledgers, and purchase orders.',
    icon: Boxes,
    to: '/features#ops',
    color: 'bg-orange-600'
  }
];

export default function Home() {
  return (
    <div className="animate-fade-in overflow-hidden relative">
      <Hero />

      <TrustSection />

      {/* Solutions Hub */}
      <section className="py-40 bg-white relative">
        <div className="section-container">
           <div className="text-center max-w-3xl mx-auto mb-24">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-4">Enterprise Solutions</p>
              <h2 className="text-4xl font-black text-slate-900 sm:text-6xl tracking-tighter mb-8 leading-tight">
                 Built for the way your <br />business <span className="italic text-primary-600">actually</span> works.
              </h2>
           </div>

           <div className="grid lg:grid-cols-3 gap-8">
              {solutions.map((s, i) => (
                <ThreeDCard key={s.title} intensity={10}>
                   <Link to={s.to} className="block group">
                      <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-3d-hover transition-all duration-500 h-full relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl group-hover:bg-primary-600/10 transition-colors" />

                         <div className={`h-16 w-16 rounded-2xl ${s.color} text-white flex items-center justify-center mb-10 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                            <s.icon className="h-8 w-8" />
                         </div>

                         <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">{s.title}</h3>
                         <p className="text-slate-500 font-medium leading-relaxed mb-10">{s.desc}</p>

                         <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 group-hover:gap-4 transition-all">
                            Learn More
                            <ArrowRight className="h-4 w-4" />
                         </div>
                      </div>
                   </Link>
                </ThreeDCard>
              ))}
           </div>
        </div>
      </section>

      <Ecosystem />

      <FeatureGrid />

      <CTASection />
    </div>
  );
}
