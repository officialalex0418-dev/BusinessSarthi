import { ArrowRight, Sparkles } from 'lucide-react';
import { siteConfig } from '../../config/site';
import ThreeDCard from '../common/ThreeDCard';

export default function CTASection() {
  return (
    <section className="py-60 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-dots opacity-[0.05] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-primary-50/50 to-transparent -z-10" />

      <div className="section-container !max-w-full relative z-10">
        <ThreeDCard intensity={5}>
           <div className="bg-slate-900 rounded-[5rem] p-12 lg:p-32 text-center text-white relative overflow-hidden shadow-[0_40px_100px_rgba(15,23,42,0.3)] border border-white/5 group">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse-soft" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -ml-48 -mb-48" />

              <div className="relative z-10 space-y-12">
                 <div className="h-20 w-20 rounded-3xl bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-16 animate-float">
                    <Sparkles className="h-10 w-10" />
                 </div>

                 <h2 className="text-5xl font-black sm:text-8xl tracking-tighter uppercase italic leading-[0.85]">
                    Your Business. <br /><span className="text-primary-500 not-italic">Limitless.</span>
                 </h2>

                 <p className="text-slate-400 text-xl lg:text-3xl font-medium max-w-3xl mx-auto leading-relaxed">
                    Stop fighting spreadsheets. Start leading with intelligence.
                    Deploy Business Sarthi across your organization today.
                 </p>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
                    <a
                      href={siteConfig.links.register}
                      className="w-full sm:w-auto px-16 py-8 rounded-[2.5rem] bg-primary-600 text-white font-black uppercase tracking-[0.4em] text-sm hover:bg-primary-700 hover:scale-105 active:scale-95 shadow-2xl shadow-primary-500/20 transition-all"
                    >
                       Get Started Now
                    </a>
                    <a
                      href="/contact"
                      className="w-full sm:w-auto px-16 py-8 rounded-[2.5rem] bg-white/5 border-2 border-white/10 text-white font-black uppercase tracking-[0.4em] text-sm hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-4"
                    >
                       Talk to Sales
                       <ArrowRight className="h-4 w-4" />
                    </a>
                 </div>
              </div>
           </div>
        </ThreeDCard>
      </div>
    </section>
  );
}
