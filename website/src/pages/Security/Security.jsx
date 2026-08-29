import { Shield, Lock, Eye, Key, Database, FileSearch } from 'lucide-react';
import ThreeDCard from '../../components/common/ThreeDCard';

const securityLayers = [
  {
    title: 'Authentication',
    desc: 'JWT-based sessions with rotating refresh tokens and automatic reuse detection.',
    icon: Key,
    color: 'bg-blue-500'
  },
  {
    title: 'Authorization',
    desc: 'Granular Role-Based Access Control (RBAC) ensuring users only see what they need.',
    icon: Lock,
    color: 'bg-indigo-500'
  },
  {
    title: 'Tenant Isolation',
    desc: 'Strict logical separation of company data. Company A can never access Company B.',
    icon: Database,
    color: 'bg-emerald-500'
  },
  {
    title: 'Audit Logging',
    desc: 'Every critical action is logged with IP, user-agent, and timestamp for full transparency.',
    icon: FileSearch,
    color: 'bg-orange-500'
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
    color: 'bg-sky-500'
  },
];

export default function Security() {
  return (
    <div className="pt-32 pb-24">
      <section className="bg-slate-50 py-32 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square border-8 border-primary-600 rounded-full" />
        </div>

        <div className="section-container relative z-10 text-center max-w-3xl">
          <div className="h-20 w-20 rounded-3xl bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float">
             <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 sm:text-6xl mb-8 tracking-tight">
            Built With <span className="text-primary-600 italic">Security</span> in Mind.
          </h1>
          <p className="lead">
            We understand that your business data is your most valuable asset.
            Business Sarthi is engineered with multiple layers of enterprise-grade
            security to ensure absolute privacy and control.
          </p>
        </div>
      </section>

      <section className="py-32">
        <div className="section-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityLayers.map((layer, i) => (
              <ThreeDCard key={layer.title} intensity={15} className="h-full">
                <div className="bg-white h-full p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-3d transition-all duration-500 group">
                   <div className={`h-14 w-14 rounded-2xl ${layer.color} text-white flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                      <layer.icon className="h-7 w-7" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{layer.title}</h3>
                   <p className="text-slate-500 text-sm leading-relaxed font-medium leading-relaxed">{layer.desc}</p>
                </div>
              </ThreeDCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
         <div className="section-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
               <div>
                  <h2 className="text-3xl font-black sm:text-5xl mb-8 leading-tight">Your Data. <br />Your Privacy. <br /><span className="text-primary-400">Our Priority.</span></h2>
                  <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                     Unlike generic platforms, Business Sarthi provides a dedicated
                     logical environment for every organization. This means your
                     employees, sales data, and financial records are strictly
                     isolated and protected.
                  </p>
                  <div className="space-y-4">
                     {['Real-time audit trails', 'Encrypted communication', 'Multi-tenant database design'].map(item => (
                       <div key={item} className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary-500/20 flex items-center justify-center">
                             <div className="h-2 w-2 rounded-full bg-primary-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-200 uppercase tracking-widest">{item}</span>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-primary-600/20 blur-[100px]" />
                  <ThreeDCard intensity={5}>
                     <div className="relative glass-dark p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                        <div className="space-y-6">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="flex gap-4 items-center">
                                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10" />
                                <div className="flex-1 space-y-2">
                                   <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                   <div className="h-2 w-1/4 bg-white/5 rounded-full" />
                                </div>
                             </div>
                           ))}
                           <div className="pt-4 flex justify-center">
                              <div className="h-12 w-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
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
