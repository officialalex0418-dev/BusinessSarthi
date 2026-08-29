import FeatureGrid from '../../components/features/FeatureGrid';
import PremiumFeature from '../../components/features/PremiumFeature';
import { siteConfig } from '../../config/site';
import { ShieldCheck, Zap, Globe2, Cpu, BarChart3, Database, Layers } from 'lucide-react';
import ThreeDCard from '../../components/common/ThreeDCard';
import ThreeDBackground from '../../components/common/ThreeDBackground';

export default function Features() {
  return (
    <div className="pt-32 bg-white relative overflow-hidden">
      {/* Modern Header */}
      <section className="py-40 relative z-10">
        <div className="section-container text-center max-w-6xl relative">
          <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl flex items-center justify-center text-white mx-auto mb-10 animate-float border-4 border-white/10">
             <Layers className="h-10 w-10" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-600 mb-6">Platform Capabilities</p>
          <h1 className="text-5xl font-black text-slate-900 sm:text-9xl mb-8 tracking-tighter leading-[0.85]">
            One Platform. <br /><span className="text-primary-600 italic">Total Visibility.</span>
          </h1>
          <p className="lead max-w-3xl mx-auto text-slate-500 font-medium italic border-l-4 border-primary-100 pl-8 text-left mt-12">
            "Software shouldn't just record what happened. <br className="hidden md:block" /> It should tell you what to do next."
          </p>
        </div>
      </section>

      {/* Feature Deep Dives */}
      <div id="people" className="relative z-10">
        <PremiumFeature
          subtitle="Workforce & People"
          title="Digitalize your entire human operation."
          desc="Connect your team from office to field. Business Sarthi provides biometric-grade GPS attendance tracking, automated payroll, and intelligent performance monitoring."
          points={['Live GPS Movement Tracking', 'Geofenced Check-ins', 'Automated Salary Slips', 'Leave & Attendance History']}
          image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2070"
          reverse={false}
        />
      </div>

      <div id="sales" className="relative z-10">
        <PremiumFeature
          subtitle="Sales Intelligence"
          title="Targets, met with precision."
          desc="Set real-time monthly sales targets and monitor individual achievement percentages. Our sales force intelligence turns every entry into growth data."
          points={['Real-time Target Tracking', 'Achievement Progress Bars', 'Product Performance Data', 'Sales Force Visibility']}
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
          reverse={true}
        />
      </div>

      <div id="ops" className="relative z-10">
        <PremiumFeature
          subtitle="Inventory & Operations"
          title="Synchronized supply chain management."
          desc="Bridge the gap between procurement and profit. Manage vendors, distributors, and stock levels in one unified, real-time environment."
          points={['Distributor Ledger Mgmt', 'Low Stock Smart Alerts', 'Purchase History Records', 'Synchronized SKU Tracking']}
          image="https://images.unsplash.com/photo-1553413766-41f9d287af3c?auto=format&fit=crop&q=80&w=2089"
          reverse={false}
        />
      </div>

      {/* Modern Grid Overlay */}
      <div className="bg-slate-900 py-40 text-white relative overflow-hidden z-10">
         <div className="absolute top-0 right-0 w-full h-full bg-primary-600/5 -z-10" />
         <FeatureGrid />
      </div>

      {/* Technical Excellence */}
      <section className="py-40 bg-white relative z-10">
        <div className="section-container">
           <div className="text-center max-w-4xl mx-auto mb-32">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-4">Infrastructure</p>
              <h2 className="text-5xl font-black text-slate-900 sm:text-8xl tracking-tighter">Engineering Excellence.</h2>
           </div>

           <div className="grid md:grid-cols-3 gap-16">
              {[
                { title: 'Multi-tenant Isolation', desc: 'Your business data is strictly logically isolated at the database layer.', icon: Database },
                { title: 'Real-time Sockets', desc: 'Experience instant synchronization across all connected field and office devices.', icon: Zap },
                { title: 'Enterprise Security', desc: 'Built with JWT rotation, RBAC, and comprehensive audit logging.', icon: ShieldCheck },
              ].map((item, i) => (
                <div key={i} className="space-y-8 group">
                   <div className="h-20 w-20 rounded-3xl bg-slate-50 text-primary-600 flex items-center justify-center border border-slate-100 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary-200">
                      <item.icon className="h-10 w-10" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{item.title}</h3>
                   <p className="text-slate-500 text-xl font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
