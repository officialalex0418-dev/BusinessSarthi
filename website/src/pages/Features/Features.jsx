import FeatureGrid from '../../components/features/FeatureGrid';
import PremiumFeature from '../../components/features/PremiumFeature';
import { siteConfig } from '../../config/site';
import { ShieldCheck, Zap, Globe2, Cpu, BarChart3, Database } from 'lucide-react';
import ThreeDCard from '../../components/common/ThreeDCard';

export default function Features() {
  return (
    <div className="pt-32 bg-white">
      {/* Modern Header */}
      <section className="bg-slate-50 py-40 overflow-hidden relative border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="section-container text-center max-w-4xl relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-600 mb-6">Platform Capabilities</p>
          <h1 className="text-5xl font-black text-slate-900 sm:text-8xl mb-8 tracking-tighter leading-[0.9]">
            One Platform. <br /><span className="text-primary-600 italic">Total Visibility.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto text-slate-500 font-medium italic">
            "Software shouldn't just record what happened. <br className="hidden md:block" /> It should tell you what to do next."
          </p>
        </div>
      </section>

      {/* Feature Deep Dives */}
      <div id="people">
        <PremiumFeature
          subtitle="Workforce & People"
          title="Digitalize your entire human operation."
          desc="Connect your team from office to field. Business Sarthi provides biometric-grade GPS attendance tracking, automated payroll, and intelligent performance monitoring."
          points={['Live GPS Movement Tracking', 'Geofenced Check-ins', 'Automated Salary Slips', 'Leave & Attendance History']}
          image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2070"
          reverse={false}
        />
      </div>

      <div id="sales">
        <PremiumFeature
          subtitle="Sales Performance"
          title="Targets, met with precision."
          desc="Set real-time monthly sales targets and monitor individual achievement percentages. Our sales force intelligence turns every entry into growth data."
          points={['Real-time Target Tracking', 'Achievement Progress Bars', 'Product Performance Data', 'Sales Force Visibility']}
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
          reverse={true}
        />
      </div>

      <div id="ops">
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
      <div className="bg-slate-900 py-40 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full bg-primary-600/5 -z-10" />
         <FeatureGrid />
      </div>

      {/* Technical Excellence */}
      <section className="py-40 bg-white relative">
        <div className="section-container">
           <div className="text-center max-w-3xl mx-auto mb-24">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-4">Infrastructure</p>
              <h2 className="text-4xl font-black text-slate-900 sm:text-6xl tracking-tighter">Engineering Excellence.</h2>
           </div>

           <div className="grid md:grid-cols-3 gap-12">
              {[
                { title: 'Multi-tenant Isolation', desc: 'Your business data is strictly logically isolated at the database layer.', icon: Database },
                { title: 'Real-time Sockets', desc: 'Experience instant synchronization across all connected field and office devices.', icon: Zap },
                { title: 'Enterprise Security', desc: 'Built with JWT rotation, RBAC, and comprehensive audit logging.', icon: ShieldCheck },
              ].map((item, i) => (
                <div key={i} className="space-y-6 group">
                   <div className="h-14 w-14 rounded-2xl bg-slate-50 text-primary-600 flex items-center justify-center border border-slate-100 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <item.icon className="h-6 w-6" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{item.title}</h3>
                   <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
