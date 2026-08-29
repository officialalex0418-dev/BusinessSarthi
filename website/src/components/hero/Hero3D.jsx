import { CheckCircle2, TrendingUp, Users, MapPin, Boxes } from 'lucide-react';
import ThreeDCard from '../common/ThreeDCard';

export default function Hero3D() {
  return (
    <div className="relative w-full aspect-square lg:aspect-video flex items-center justify-center pointer-events-none">
      <ThreeDCard className="w-[85%] relative z-10" intensity={5}>
         <div className="rounded-3xl bg-slate-900 shadow-3d overflow-hidden border border-white/10 group pointer-events-auto">
            <div className="bg-slate-800/50 border-b border-white/5 p-4 flex items-center gap-2">
               <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
               </div>
               <div className="h-4 w-32 bg-white/5 rounded-full ml-4" />
            </div>
            <div className="p-6 grid grid-cols-12 gap-4 h-full">
               <div className="col-span-3 space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 bg-white/5 rounded-xl w-full" />
                  ))}
               </div>
               <div className="col-span-9 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
                     ))}
                  </div>
                  <div className="h-48 bg-gradient-to-br from-primary-600/20 to-transparent rounded-2xl border border-primary-500/10" />
               </div>
            </div>
         </div>
      </ThreeDCard>

      {/* Floating UI Elements */}
      <div className="absolute top-[10%] left-[5%] z-20 animate-float pointer-events-auto">
         <ThreeDCard intensity={20}>
            <div className="glass p-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[180px]">
               <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sales Growth</p>
                  <p className="text-lg font-black text-slate-900">+24.8%</p>
               </div>
            </div>
         </ThreeDCard>
      </div>

      <div className="absolute bottom-[20%] right-[0%] z-20 animate-float [animation-delay:1s] pointer-events-auto">
         <ThreeDCard intensity={20}>
            <div className="glass p-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[200px]">
               <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <Users className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Staff</p>
                  <p className="text-lg font-black text-slate-900">128 Total</p>
               </div>
            </div>
         </ThreeDCard>
      </div>

      <div className="absolute top-[50%] -left-[10%] z-20 animate-float [animation-delay:0.5s] pointer-events-auto hidden lg:block">
         <ThreeDCard intensity={30}>
            <div className="glass p-3 rounded-xl shadow-lg border border-primary-100 flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
               </div>
               <span className="text-xs font-bold text-slate-700">Live GPS Active</span>
            </div>
         </ThreeDCard>
      </div>

      <div className="absolute -bottom-[5%] left-[20%] z-20 animate-float [animation-delay:1.5s] pointer-events-auto hidden lg:block">
         <ThreeDCard intensity={30}>
            <div className="glass p-3 rounded-xl shadow-lg border border-primary-100 flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Boxes className="h-4 w-4" />
               </div>
               <span className="text-xs font-bold text-slate-700">Stock: 1,284 SKU</span>
            </div>
         </ThreeDCard>
      </div>
    </div>
  );
}
