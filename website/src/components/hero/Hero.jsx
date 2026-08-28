import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { siteConfig } from '../../config/site';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100 rounded-full blur-[120px]" />
         <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px]" />
      </div>

      <div className="section-container text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider mb-8 animate-slide-up">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
           </span>
           The Ultimate Business Management Platform
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 animate-slide-up">
          Everything Your Business Needs. <br className="hidden lg:block" />
          <span className="text-primary-600">In One Place.</span>
        </h1>

        <p className="lead max-w-2xl mx-auto mb-10 animate-slide-up [animation-delay:200ms]">
          Business Sarthi helps you manage your people, sales, attendance, inventory,
          and performance from a single intelligent platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up [animation-delay:400ms]">
          <a href={siteConfig.links.register} className="btn btn-primary text-lg px-8 py-4 gap-3 w-full sm:w-auto">
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </a>
          <a href="#features" className="btn btn-outline text-lg px-8 py-4 w-full sm:w-auto">
            Explore Features
          </a>
        </div>

        {/* Dashboard Mockup Placeholder */}
        <div className="relative mx-auto max-w-5xl animate-slide-up [animation-delay:600ms]">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl overflow-hidden shadow-primary-500/10">
            <div className="rounded-xl bg-slate-900 aspect-video flex items-center justify-center text-white overflow-hidden">
               {/*
                  Actually we should use a real screenshot if available.
                  Since I cannot easily see images, I'll use a stylized CSS representation or just a placeholder for now.
               */}
               <img
                 src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                 alt="Business Sarthi Dashboard"
                 className="w-full h-full object-cover opacity-80"
               />
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-6 -left-6 hidden lg:block bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce [animation-duration:3s]">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                 <CheckCircle2 className="h-6 w-6" />
               </div>
               <div className="text-left">
                 <p className="text-xs text-slate-500 font-medium">Monthly Growth</p>
                 <p className="text-lg font-bold text-slate-900">+24%</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
