import FeatureGrid from '../../components/features/FeatureGrid';
import FeatureShowcase from '../../components/features/FeatureShowcase';
import { siteConfig } from '../../config/site';

export default function Features() {
  return (
    <div className="pt-20">
      <section className="bg-slate-50 py-24">
        <div className="section-container text-center max-w-3xl">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-6">
            One Platform. <span className="text-primary-600">Total Visibility.</span>
          </h1>
          <p className="lead text-lg">
            Explore the powerful tools that make {siteConfig.name} the most trusted
            business management partner for growing companies.
          </p>
        </div>
      </section>

      <FeatureShowcase />
      <FeatureGrid />

      {/* Bonus Features Section */}
      <section className="py-24 border-t border-slate-100">
        <div className="section-container">
           <div className="grid md:grid-cols-2 gap-12">
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
                 <h3 className="text-xl font-bold mb-4">Enterprise-Grade Security</h3>
                 <p className="text-slate-600">
                    Your data is safe with us. We use industry-standard encryption, multi-tenant isolation,
                    and regular security audits to ensure your business information remains private and secure.
                 </p>
              </div>
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
                 <h3 className="text-xl font-bold mb-4">Real-time Synchronization</h3>
                 <p className="text-slate-600">
                    Stay updated with instant push notifications and Socket.io powered real-time updates.
                    Whether it's a sales submission or an attendance alert, you'll know it immediately.
                 </p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
