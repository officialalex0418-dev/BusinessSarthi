import { Check } from 'lucide-react';
import ThreeDCard from '../common/ThreeDCard';
import { cn } from '../../utils/cn';

export default function PremiumFeature({ title, subtitle, desc, points, image, reverse, theme = 'blue' }) {
  const themeClasses = {
    blue: 'from-primary-600/20 to-transparent',
    emerald: 'from-emerald-600/20 to-transparent',
    orange: 'from-orange-600/20 to-transparent',
  };

  return (
    <section className="py-32 overflow-hidden relative">
      <div className={cn(
        "section-container flex flex-col lg:flex-row items-center gap-20",
        reverse ? "lg:flex-row-reverse" : ""
      )}>
        <div className="flex-1 w-full relative">
           <div className={cn(
             "absolute -z-10 w-full aspect-square rounded-full blur-[100px] opacity-40 animate-pulse-soft",
             reverse ? "-left-1/4 top-0 bg-primary-200" : "-right-1/4 top-0 bg-emerald-100"
           )} />

           <ThreeDCard intensity={5}>
              <div className="relative group">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent rounded-[2.5rem] -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
                 <div className="relative rounded-[2rem] overflow-hidden shadow-3d border border-slate-100 bg-white p-2">
                    <img src={image} alt={title} className="rounded-xl w-full aspect-video object-cover" />
                 </div>
              </div>
           </ThreeDCard>
        </div>

        <div className="flex-1 space-y-8 animate-slide-up">
           <div>
              <p className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">{subtitle}</p>
              <h2 className="text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                {title}
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                {desc}
              </p>
           </div>

           <div className="grid sm:grid-cols-2 gap-4">
              {points.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all duration-300">
                   <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Check className="h-3.5 w-3.5" />
                   </div>
                   <span className="text-sm font-bold text-slate-700">{p}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
