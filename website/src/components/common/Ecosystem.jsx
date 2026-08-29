import {
  Users, TrendingUp, Boxes, Truck, Building2,
  Wallet, CalendarCheck, BarChart3, Globe2
} from 'lucide-react';
import ThreeDCard from './ThreeDCard';

const nodes = [
  { name: 'Employees', icon: Users, color: 'bg-blue-500' },
  { name: 'Sales', icon: TrendingUp, color: 'bg-emerald-500' },
  { name: 'Inventory', icon: Boxes, color: 'bg-orange-500' },
  { name: 'Purchases', icon: Globe2, color: 'bg-indigo-500' },
  { name: 'Vendors', icon: Building2, color: 'bg-purple-500' },
  { name: 'Distributors', icon: Truck, color: 'bg-blue-600' },
  { name: 'Payroll', icon: Wallet, color: 'bg-rose-500' },
  { name: 'Attendance', icon: CalendarCheck, color: 'bg-sky-500' },
  { name: 'Analytics', icon: BarChart3, color: 'bg-amber-500' },
];

export default function Ecosystem() {
  return (
    <section className="py-32 bg-slate-900 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square border border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      <div className="section-container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24 animate-slide-up">
           <h2 className="text-3xl font-black text-white sm:text-5xl mb-6">
              Your Entire Business. <span className="text-primary-400 italic">Connected.</span>
           </h2>
           <p className="text-slate-400 text-lg">
              Business Sarthi is the intelligent hub that connects every department,
              data point, and operation within your organization.
           </p>
        </div>

        <div className="relative h-[600px] flex items-center justify-center">
           {/* Center Hub */}
           <div className="relative z-20">
              <ThreeDCard intensity={40}>
                 <div className="h-32 w-32 md:h-48 md:w-48 rounded-full bg-primary-600 shadow-[0_0_80px_rgba(37,99,235,0.4)] flex items-center justify-center border-4 border-white/10 group cursor-default">
                    <img src="/logo.png" alt="Logo" className="h-16 w-auto md:h-24 brightness-0 invert" />
                 </div>
              </ThreeDCard>
           </div>

           {/* Orbiting Nodes */}
           {nodes.map((node, i) => {
              const angle = (i * (360 / nodes.length)) * (Math.PI / 180);
              const radius = 240; // Default for desktop
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={node.name}
                  className="absolute animate-float"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${i * 0.2}s`
                  }}
                >
                   <ThreeDCard intensity={20}>
                      <div className="flex flex-col items-center gap-3 group">
                         <div className={`h-12 w-12 md:h-16 md:w-16 rounded-2xl ${node.color} shadow-2xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 border border-white/20`}>
                            <node.icon className="h-6 w-6 md:h-8 md:w-8" />
                         </div>
                         <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            {node.name}
                         </span>
                      </div>
                   </ThreeDCard>
                </div>
              );
           })}

           {/* Connecting Lines (CSS only) */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              {nodes.map((_, i) => (
                <div
                  key={i}
                  className="absolute h-[1px] bg-gradient-to-r from-transparent via-primary-500 to-transparent w-[500px]"
                  style={{ transform: `rotate(${i * (360 / nodes.length)}deg)` }}
                />
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
