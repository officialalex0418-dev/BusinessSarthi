import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';
import { Target, Eye, Heart, Rocket, Users2 } from 'lucide-react';

const values = [
  {
    title: 'Simple',
    desc: 'Powerful software should be easy to use. We build tools that require zero learning curve.',
    icon: Heart,
    color: 'bg-rose-500'
  },
  {
    title: 'Smart',
    desc: 'Automated insights and intelligence that help you make better business decisions.',
    icon: Eye,
    color: 'bg-primary-600'
  },
  {
    title: 'Connected',
    desc: 'Breaking silos between field staff, managers, and office operations.',
    icon: Target,
    color: 'bg-emerald-500'
  },
  {
    title: 'Scalable',
    desc: 'Designed to grow with your business, from 5 employees to 5,000.',
    icon: Rocket,
    color: 'bg-orange-500'
  },
];

export default function About() {
  return (
    <div className="pt-32 relative overflow-hidden">
      {/* Header */}
      <section className="py-40 relative z-10">
        <div className="section-container text-center max-w-6xl relative">
          <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float border-4 border-white/10">
             <Users2 className="h-10 w-10" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-600 mb-6">Our Vision</p>
          <h1 className="text-5xl font-black text-slate-900 sm:text-8xl mb-8 tracking-tighter leading-[0.9]">
            Empowering businesses <br />through <span className="text-primary-600 italic border-b-8 border-primary-50/50 pb-2">intelligence.</span>
          </h1>
          <p className="lead max-w-3xl mx-auto font-medium text-slate-500 italic">
            "Business Sarthi was founded to bridge the gap between traditional <br className="hidden md:block" /> management and modern digital intelligence."
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-40 relative z-10">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="animate-slide-up space-y-10">
              <h2 className="text-4xl font-black sm:text-7xl mb-8 tracking-tighter uppercase leading-[0.9]">Our <span className="text-primary-600">Mission.</span></h2>
              <div className="space-y-8 text-slate-600 text-xl leading-relaxed font-medium">
                <p>
                  We believe that running a business should be about strategy and growth, not managing
                  repetitive manual tasks and fighting with spreadsheets.
                </p>
                <p>
                  Business Sarthi provides a unified platform that connects every part of your
                  organization — from field staff tracking to payroll management — giving you the
                  visibility and control you need to succeed in a data-driven world.
                </p>
              </div>
              <div className="flex gap-12 pt-8">
                 <div>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">500+</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Active Companies</p>
                 </div>
                 <div>
                    <p className="text-5xl font-black text-primary-600 tracking-tighter">10k+</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Tracked Users</p>
                 </div>
              </div>
            </div>
            <div className="relative">
               <div className="absolute inset-0 bg-primary-500/10 blur-[120px] rounded-full" />
               <ThreeDCard intensity={5}>
                  <div className="rounded-[4rem] overflow-hidden shadow-3d border border-slate-100 p-4 bg-white">
                     <img
                       src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070"
                       alt="Our Team"
                       className="rounded-[3.5rem] grayscale hover:grayscale-0 transition-all duration-700 aspect-square object-cover"
                     />
                  </div>
               </ThreeDCard>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-40 bg-slate-900 text-white relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />

        <div className="section-container relative z-10">
           <h2 className="text-4xl font-black text-center mb-32 sm:text-7xl tracking-tighter uppercase italic">Why Business Sarthi?</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
             {values.map(v => (
               <ThreeDCard key={v.title} intensity={15} className="h-full">
                 <div className="p-12 h-full rounded-[3.5rem] bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all group flex flex-col items-center text-center">
                   <div className={`h-20 w-20 rounded-3xl ${v.color} text-white flex items-center justify-center mb-10 shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6`}>
                      <v.icon className="h-10 w-10" />
                   </div>
                   <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter group-hover:text-primary-400">{v.title}</h3>
                   <p className="text-slate-400 text-base font-medium leading-relaxed">{v.desc}</p>
                 </div>
               </ThreeDCard>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
}
