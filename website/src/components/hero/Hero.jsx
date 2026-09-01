import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { siteConfig } from '../../config/site';
import Hero3D from './Hero3D';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-56 lg:pb-32 overflow-hidden min-h-screen flex items-center bg-white">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
         <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary-100/30 rounded-full blur-[150px] animate-pulse-soft" />
         <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-50/40 rounded-full blur-[120px] animate-pulse-soft [animation-delay:1s]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-primary-50/10 rounded-full blur-[200px]" />

         {/* Subtle Grid */}
         <div className="absolute inset-0 opacity-[0.04] bg-grid" />
      </div>

      <div className="section-container !max-w-full relative">
        <div className="flex flex-col items-center text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white shadow-2xl border border-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-[0.4em] mb-12">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
               </span>
               Enterprise Intelligence Platform
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-slate-900 leading-[0.8] mb-12 tracking-tighter uppercase italic">
              Run. <span className="text-primary-600">Track.</span><br />
              <span className="text-slate-200">Scale.</span>
            </h1>

            <p className="lead max-w-3xl mx-auto mb-16 text-slate-500 font-medium lg:text-3xl tracking-tight">
              Business Sarthi is the unified operating system for modern organizations.
              Manage people, sales, and operations in one secure, real-time environment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <a href={siteConfig.links.register} className="w-full sm:w-auto px-16 py-7 rounded-[2rem] bg-primary-600 text-white font-black uppercase tracking-[0.4em] text-sm shadow-2xl shadow-primary-200 hover:scale-[1.05] active:scale-95 transition-all">
                Deploy Now
              </a>
              <a href="/features" className="w-full sm:w-auto px-16 py-7 rounded-[2rem] bg-white border-2 border-slate-100 text-slate-900 font-black uppercase tracking-[0.4em] text-sm hover:border-primary-600 hover:text-primary-600 transition-all flex items-center gap-3">
                Capabilities
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative w-full mt-32 animate-slide-up [animation-delay:400ms]">
            <Hero3D />
          </div>
        </div>
      </div>
    </section>
  );
}
