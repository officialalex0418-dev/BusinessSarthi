import { XCircle, ArrowRight } from 'lucide-react';
import ThreeDCard from './ThreeDCard';

const problems = [
  'Manual attendance tracking errors',
  'Scattered employee information',
  'Difficult sales monitoring',
  'Poor visibility into performance',
  'Inventory management challenges',
  'Complex manual reporting',
];

export default function ProblemSection() {
  return (
    <section className="py-40 bg-white relative overflow-hidden">
      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="animate-slide-up">
            <p className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">The Challenge</p>
            <h2 className="text-4xl font-black text-slate-900 sm:text-6xl mb-8 tracking-tight leading-[1.1]">
              Running a business shouldn't be a <span className="text-primary-600">spreadsheet</span> battle.
            </h2>
            <p className="lead mb-10">
              Legacy systems and disconnected tools create operational blind spots.
              Business Sarthi provides the clarity you need to move from management to leadership.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {problems.map((problem) => (
                <div key={problem} className="flex items-center gap-3 group">
                  <div className="h-2 w-2 rounded-full bg-red-400 group-hover:scale-150 transition-transform" />
                  <span className="text-slate-700 font-bold text-sm tracking-tight">{problem}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-primary-600/10 blur-[120px] rounded-full" />
             <ThreeDCard intensity={10}>
                <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 shadow-3d border border-white/5 relative overflow-hidden group">
                   {/* Background pulse */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -mr-32 -mt-32" />

                   <div className="relative z-10 space-y-8">
                      <div className="h-16 w-16 rounded-2xl bg-primary-600 shadow-xl shadow-primary-500/30 flex items-center justify-center text-white">
                         <ArrowRight className="h-8 w-8" />
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight italic">
                         Upgrade to <br /><span className="text-primary-400">Total Business Intelligence.</span>
                      </h3>
                      <p className="text-slate-400 font-medium">
                         Replace manual friction with automated growth.
                         Business Sarthi scales with your ambition.
                      </p>
                      <button className="text-sm font-black uppercase tracking-widest text-primary-400 border-b-2 border-primary-400/20 pb-1 hover:border-primary-400 transition-all">
                         See the solution →
                      </button>
                   </div>
                </div>
             </ThreeDCard>
          </div>
        </div>
      </div>
    </section>
  );
}
