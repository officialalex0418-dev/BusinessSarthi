import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';
import { Target, Eye, Heart, Rocket } from 'lucide-react';

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
    <div className="pt-32">
      {/* Header */}
      <section className="bg-slate-50 py-32 overflow-hidden relative">
        <div className="section-container text-center max-w-4xl relative z-10">
          <p className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">Our Vision</p>
          <h1 className="text-4xl font-black text-slate-900 sm:text-7xl mb-8 tracking-tight leading-tight">
            Empowering businesses <br />through <span className="text-primary-600 italic border-b-8 border-primary-100 pb-2">intelligence.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto">
            Business Sarthi was founded with a single mission: to simplify complex business operations
            through modern, cloud-based technology.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-32">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="animate-slide-up">
              <h2 className="text-3xl font-black sm:text-5xl mb-8 leading-tight">Our Mission</h2>
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
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
            </div>
            <div className="relative">
               <ThreeDCard intensity={5}>
                  <div className="rounded-[3rem] overflow-hidden shadow-3d border border-slate-100 p-3 bg-white">
                     <img
                       src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070"
                       alt="Our Team"
                       className="rounded-[2.5rem]"
                     />
                  </div>
               </ThreeDCard>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-600 rounded-full blur-[100px]" />
        </div>

        <div className="section-container relative z-10">
           <h2 className="text-3xl font-black text-center mb-24 sm:text-5xl tracking-tight">Why {siteConfig.name}?</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             {values.map(v => (
               <ThreeDCard key={v.title} intensity={15} className="h-full">
                 <div className="p-10 h-full rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary-500/50 transition-colors group flex flex-col items-center text-center">
                   <div className={`h-16 w-16 rounded-2xl ${v.color} text-white flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                      <v.icon className="h-8 w-8" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 uppercase tracking-tight group-hover:text-primary-400">{v.title}</h3>
                   <p className="text-slate-400 text-sm leading-relaxed font-medium">{v.desc}</p>
                 </div>
               </ThreeDCard>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
}
