import { productFeatures } from '../../data/features';
import ThreeDCard from '../common/ThreeDCard';

export default function FeatureGrid() {
  return (
    <section id="features" className="py-32 bg-white relative">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent" />

      <div className="section-container relative">
        <div className="text-center max-w-3xl mx-auto mb-24 animate-slide-up">
          <p className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">Comprehensive Suite</p>
          <h2 className="text-3xl font-black text-slate-900 sm:text-5xl tracking-tight mb-6">Core <span className="text-primary-600">Capabilities</span></h2>
          <p className="lead">
            Every tool you need to digitalize your operations, empower your people, and accelerate your business growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productFeatures.map((f, i) => (
            <ThreeDCard key={f.id} intensity={10} className="h-full">
              <div className="bg-white h-full p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-3d-hover hover:border-primary-100 transition-all duration-500 group relative overflow-hidden">
                {/* Accent background */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-[6] transition-transform duration-700" />

                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-8 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm">
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-primary-900">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium group-hover:text-slate-600">{f.desc}</p>
                </div>

                <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="h-2 w-12 bg-primary-200 rounded-full" />
                </div>
              </div>
            </ThreeDCard>
          ))}
        </div>
      </div>
    </section>
  );
}
