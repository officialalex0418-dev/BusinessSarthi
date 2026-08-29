import { useState } from 'react';
import { productFeatures, featureCategories } from '../../data/features';
import ThreeDCard from '../common/ThreeDCard';
import { cn } from '../../utils/cn';

export default function FeatureGrid() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? productFeatures
    : productFeatures.filter(f => f.category === activeTab);

  return (
    <section id="features" className="py-60 relative overflow-hidden">
      <div className="section-container relative">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-32">
          <div className="max-w-3xl animate-slide-up text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary-600 mb-6">Platform Modules</p>
            <h2 className="text-4xl font-black text-slate-900 sm:text-8xl tracking-tighter leading-none italic uppercase">Core <br /><span className="text-primary-600 not-italic">Capabilities.</span></h2>
          </div>

          <div className="flex flex-wrap gap-3 bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100">
             {featureCategories.map(cat => (
               <button
                 key={cat.id}
                 onClick={() => setActiveTab(cat.id)}
                 className={cn(
                   "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                   activeTab === cat.id ? "bg-primary-600 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"
                 )}
               >
                 {cat.label}
               </button>
             ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((f, i) => (
            <ThreeDCard key={f.id} intensity={15} className="h-full">
              <div className="bg-white h-full p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-3d-hover hover:border-primary-100 transition-all duration-700 group relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-[8] transition-transform duration-1000" />

                <div className="relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-10 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:rotate-12">
                    <f.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-tight group-hover:text-primary-900">{f.title}</h3>
                  <p className="text-slate-500 text-base leading-relaxed font-medium group-hover:text-slate-600">{f.desc}</p>
                </div>
              </div>
            </ThreeDCard>
          ))}
        </div>
      </div>
    </section>
  );
}
