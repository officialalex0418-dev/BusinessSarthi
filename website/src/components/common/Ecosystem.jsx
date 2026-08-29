import {
  Users, TrendingUp, Boxes, Truck, Building2,
  Wallet, CalendarCheck, BarChart3, Globe2, ShieldCheck, Zap
} from 'lucide-react';
import ThreeDCard from './ThreeDCard';

const nodes = [
  { name: 'Employees', icon: Users, color: 'bg-blue-600' },
  { name: 'Sales', icon: TrendingUp, color: 'bg-emerald-600' },
  { name: 'Inventory', icon: Boxes, color: 'bg-orange-600' },
  { name: 'Finance', icon: Wallet, color: 'bg-rose-600' },
  { name: 'Logistics', icon: Truck, color: 'bg-indigo-600' },
  { name: 'Security', icon: ShieldCheck, color: 'bg-slate-900' },
  { name: 'Intelligence', icon: BarChart3, color: 'bg-amber-600' },
  { name: 'Pulse', icon: Zap, color: 'bg-sky-600' },
];

export default function Ecosystem() {
  return (
    <section className="py-60 bg-slate-900 overflow-hidden relative border-y border-white/5">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square border border-white/5 rounded-full animate-[spin_100s_linear_infinite]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square border border-white/5 rounded-full animate-[spin_60s_linear_infinite_reverse]" />
      </div>

      <div className="section-container !max-w-full relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-40 animate-slide-up">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary-400 mb-6">Omni-channel Intelligence</p>
           <h2 className="text-5xl font-black text-white sm:text-8xl mb-10 tracking-tighter leading-none italic uppercase">
              A Connected <span className="text-primary-500 italic">Ecosystem.</span>
           </h2>
           <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Business Sarthi isn't just a tool. It's the central nervous system
              of your entire organization, synchronizing every touchpoint in real-time.
           </p>
        </div>

        <div className="relative h-[800px] flex items-center justify-center">
           {/* Center Hub */}
           <div className="relative z-20">
              <ThreeDCard intensity={50}>
                 <div className="h-48 w-48 md:h-72 md:w-72 rounded-[4rem] bg-primary-600 shadow-[0_0_120px_rgba(37,99,235,0.4)] flex items-center justify-center border-4 border-white/10 group cursor-default rotate-12">
                    <img src="/logo.png" alt="Logo" className="h-24 w-auto md:h-40 brightness-0 invert -rotate-12 transition-transform duration-700 group-hover:scale-110" />
                 </div>
              </ThreeDCard>
           </div>

           {/* Orbiting Nodes */}
           {nodes.map((node, i) => {
              const angle = (i * (360 / nodes.length)) * (Math.PI / 180);
              const radius = 320; // Default for desktop
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={node.name}
                  className="absolute animate-float"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${i * 0.3}s`
                  }}
                >
                   <ThreeDCard intensity={30}>
                      <div className="flex flex-col items-center gap-6 group">
                         <div className={`h-16 w-16 md:h-24 md:w-24 rounded-[2.5rem] ${node.color} shadow-2xl flex items-center justify-center text-white transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 border border-white/20`}>
                            <node.icon className="h-8 w-8 md:h-12 md:w-12" />
                         </div>
                         <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 group-hover:text-primary-400 transition-all">
                            {node.name}
                         </span>
                      </div>
                   </ThreeDCard>
                </div>
              );
           })}

           {/* Connecting Lines */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              {nodes.map((_, i) => (
                <div
                  key={i}
                  className="absolute h-[1px] bg-gradient-to-r from-transparent via-primary-500 to-transparent w-[800px]"
                  style={{ transform: `rotate(${i * (360 / nodes.length)}deg)` }}
                />
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
