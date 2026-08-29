import { Shield, Lock, Eye, Key, Database, FileSearch, CheckCircle } from 'lucide-react';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';

const securityLayers = [
  {
    title: 'Authentication',
    desc: 'JWT-based sessions with rotating refresh tokens and automatic reuse detection.',
    icon: Key,
    color: 'bg-blue-600'
  },
  {
    title: 'Authorization',
    desc: 'Granular Role-Based Access Control (RBAC) ensuring users only see what they need.',
    icon: Lock,
    color: 'bg-indigo-600'
  },
  {
    title: 'Tenant Isolation',
    desc: 'Strict logical separation of company data. Company A can never access Company B.',
    icon: Database,
    color: 'bg-emerald-600'
  },
  {
    title: 'Audit Logging',
    desc: 'Every critical action is logged with IP, user-agent, and timestamp for full transparency.',
    icon: FileSearch,
    color: 'bg-orange-600'
  },
  {
    title: 'Network Security',
    desc: 'CORS protection, Helmet headers, and rate limiting to prevent automated attacks.',
    icon: Shield,
    color: 'bg-primary-600'
  },
  {
    title: 'Data Integrity',
    desc: 'Strict Joi schema validation and MongoDB sanitization against injection.',
    icon: Eye,
    color: 'bg-sky-600'
  },
];

export default function Security() {
  return (
    <div className="pt-32 pb-24 relative overflow-hidden">
      <section className="py-32 relative z-10">
        <div className="section-container text-center max-w-5xl relative">
          <div className="h-20 w-20 rounded-[2.5rem] bg-slate-900 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float border-4 border-white/10">
             <Shield className="h-10 w-10 text-primary-400" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 sm:text-8xl mb-8 tracking-tighter leading-[0.9]">
            Built With <br /><span className="text-primary-600 italic uppercase">Security.</span>
          </h1>
          <p className="lead max-w-3xl mx-auto italic font-medium text-slate-500">
            "Your business data is your most valuable asset. <br className="hidden md:block" /> We treat it with absolute privacy and control."
          </p>
        </div>
      </section>

      <section className="py-32 relative z-10">
        <div className="section-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {securityLayers.map((layer, i) => (
              <ThreeDCard key={layer.title} intensity={15} className="h-full">
                <div className="bg-white/80 backdrop-blur-xl h-full p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-3d transition-all duration-500 group relative overflow-hidden">
                   <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-[6] transition-transform duration-700" />

                   <div className="relative z-10">
                      <div className={`h-16 w-16 rounded-2xl ${layer.color} text-white flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                         <layer.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase">{layer.title}</h3>
                      <p className="text-slate-500 text-lg font-medium leading-relaxed">{layer.desc}</p>
                   </div>
                </div>
              </ThreeDCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-dots opacity-[0.03]" />
         <div className="section-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-32 items-center">
               <div className="animate-slide-up">
                  <p className="text-primary-400 font-black uppercase tracking-[0.4em] text-xs mb-6">Logical Isolation</p>
                  <h2 className="text-4xl font-black sm:text-7xl mb-10 leading-[0.9] tracking-tighter">Your Data. Isolated & <span className="text-primary-500 italic">Protected.</span></h2>
                  <p className="text-slate-400 text-xl mb-12 leading-relaxed font-medium">
                     Unlike generic platforms, Business Sarthi provides a dedicated
                     logical environment for every organization. This means your
                     employees, sales data, and financial records are strictly
                     isolated and protected at the database layer.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-6">
                     {['Real-time audit trails', 'Encrypted communication', 'Multi-tenant design', 'RBAC Enforcement'].map(item => (
                       <div key={item} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                          <div className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{item}</span>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-primary-600/10 blur-[150px]" />
                  <ThreeDCard intensity={5}>
                     <div className="relative glass-dark p-12 lg:p-20 rounded-[4rem] border border-white/10 shadow-2xl">
                        <div className="space-y-8">
                           {[1, 2, 3, 4].map(i => (
                             <div key={i} className="flex gap-6 items-center">
                                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                   <CheckCircle className="h-6 w-6 text-emerald-400 opacity-50" />
                                </div>
                                <div className="flex-1 space-y-3">
                                   <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                                   <div className="h-2 w-1/3 bg-white/5 rounded-full" />
                                </div>
                             </div>
                           ))}
                           <div className="pt-8 flex justify-center">
                              <div className="h-16 w-16 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                           </div>
                        </div>
                     </div>
                  </ThreeDCard>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
