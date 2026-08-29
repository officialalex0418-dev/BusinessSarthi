import FeatureGrid from '../../components/features/FeatureGrid';
import PremiumFeature from '../../components/features/PremiumFeature';
import { siteConfig } from '../../config/site';
import { ShieldCheck, Zap } from 'lucide-react';
import ThreeDCard from '../../components/common/ThreeDCard';

export default function Features() {
  return (
    <div className="pt-32">
      <section className="bg-slate-50 py-32 overflow-hidden relative">
        <div className="section-container text-center max-w-4xl relative z-10">
          <p className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">The Platform</p>
          <h1 className="text-4xl font-black text-slate-900 sm:text-7xl mb-8 tracking-tight leading-tight">
            One Platform. <br /><span className="text-primary-600 italic">Total Business Control.</span>
          </h1>
          <p className="lead max-w-2xl mx-auto">
            Explore the powerful tools that make {siteConfig.name} the most trusted
            business management partner for modern companies.
          </p>
        </div>
      </section>

      {/* Feature Modules */}
      <div id="people">
        <PremiumFeature
          subtitle="Workforce Management"
          title="Manage people with precision."
          desc="From attendance tracking with GPS verification to automated payroll, Business Sarthi connects your office and field staff in one unified environment."
          points={['Biometric-grade GPS Attendance', 'Live Location Monitoring', 'Automated Payroll & Slips', 'Departmental Hierarchy']}
          image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2070"
          reverse={false}
        />
      </div>

      <div id="sales">
        <PremiumFeature
          subtitle="Sales Intelligence"
          title="Drive revenue through data."
          desc="Monitor sales targets, individual achievements, and product performance in real-time. Gain total visibility into your sales force effectiveness."
          points={['Monthly Target Setting', 'Achievement Progress Bars', 'Individual Staff Performance', 'Product Sales Analytics']}
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
          reverse={true}
        />
      </div>

      <div id="tracking">
        <PremiumFeature
          subtitle="Field Force Automation"
          title="Know where your team is. Know what they're doing."
          desc="Business Sarthi's high-frequency GPS system provides live maps, route playback, and movement heatmaps. Optimize your field operations with real-time intelligence."
          points={['Live Movement Map', 'Route History Playback', 'Geofenced Check-ins', 'Offline Location Batching']}
          image="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=2070"
          reverse={false}
        />
      </div>

      <div id="ops">
        <PremiumFeature
          subtitle="Supply Chain & Ops"
          title="Scale your operations effortlessly."
          desc="Manage distributors, vendors, and purchases in one connected flow. Keep your inventory synchronized with your sales and procurement."
          points={['Distributor Ledger Mgmt', 'Vendor Records & History', 'Purchase Order Tracking', 'Real-time Stock Levels']}
          image="https://images.unsplash.com/photo-1553413766-41f9d287af3c?auto=format&fit=crop&q=80&w=2089"
          reverse={true}
        />
      </div>

      <FeatureGrid />

      {/* Security & Reliability */}
      <section className="py-32 border-t border-slate-100 bg-slate-900 text-white relative overflow-hidden">
        <div className="section-container relative z-10">
           <div className="grid md:grid-cols-2 gap-12">
              <ThreeDCard intensity={5}>
                <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group">
                   <div className="h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="h-7 w-7 text-white" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Enterprise Security</h3>
                   <p className="text-slate-400 font-medium leading-relaxed">
                      Your data is isolated and protected with industry-standard JWT encryption,
                      RBAC, and strict tenant isolation.
                   </p>
                </div>
              </ThreeDCard>

              <ThreeDCard intensity={5}>
                <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
                   <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <Zap className="h-7 w-7 text-white" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Real-time Pulse</h3>
                   <p className="text-slate-400 font-medium leading-relaxed">
                      Stay connected with instant socket-powered updates. Know exactly when a sale is
                      made or a check-in occurs.
                   </p>
                </div>
              </ThreeDCard>
           </div>
        </div>
      </section>
    </div>
  );
}
