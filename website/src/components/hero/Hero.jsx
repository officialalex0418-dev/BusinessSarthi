import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { siteConfig } from '../../config/site';
import Hero3D from './Hero3D';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
         <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary-100/40 rounded-full blur-[120px] animate-pulse-soft" />
         <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-emerald-50/50 rounded-full blur-[100px] animate-pulse-soft [animation-delay:1s]" />
         <div className="absolute top-[40%] right-[30%] w-[20%] h-[20%] bg-blue-50/40 rounded-full blur-[80px]" />

         {/* Subtle Grid */}
         <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
         />
      </div>

      <div className="section-container relative">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-widest mb-10 shadow-sm border border-primary-100">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
               </span>
               Enterprise Management Platform
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-slate-900 leading-[1] mb-8 tracking-tighter">
              Run Your <span className="text-primary-600 italic">Business.</span><br />
              <span className="text-primary-400">Track Your Team.</span><br />
              <span className="text-slate-800">Scale Confidence.</span>
            </h1>

            <p className="lead max-w-xl mb-12 text-slate-500 font-medium">
              Business Sarthi brings employee management, sales, inventory,
              purchases, and real-time workforce intelligence together in one
              connected platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 animate-slide-up [animation-delay:300ms]">
              <a href={siteConfig.links.register} className="btn btn-primary text-lg px-10 py-5 rounded-full gap-3 w-full sm:w-auto shadow-2xl shadow-primary-300 transition-all hover:scale-105 active:scale-95">
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </a>
              <button className="btn btn-outline text-lg px-10 py-5 rounded-full gap-3 w-full sm:w-auto border-2 border-slate-100 bg-white/50 backdrop-blur group">
                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                   <Play className="h-4 w-4 fill-current ml-1" />
                </div>
                Watch Demo
              </button>
            </div>

            <div className="mt-16 flex items-center gap-8 animate-slide-up [animation-delay:500ms]">
               <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden ring-1 ring-slate-100 shadow-lg">
                       <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                  <div className="h-12 w-12 rounded-full border-4 border-white bg-primary-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-slate-100 shadow-lg">
                    +500
                  </div>
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-900 leading-none mb-1">Trusted by 500+ Companies</p>
                  <div className="flex gap-0.5 text-amber-400">
                     {[1, 2, 3, 4, 5].map(i => <CheckCircle2 key={i} className="h-3 w-3 fill-current" />)}
                  </div>
               </div>
            </div>
          </div>

          <div className="relative animate-slide-up [animation-delay:400ms]">
            <Hero3D />
          </div>
        </div>
      </div>
    </section>
  );
}
