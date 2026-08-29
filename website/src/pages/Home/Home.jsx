import Hero from '../../components/hero/Hero';
import FeatureGrid from '../../components/features/FeatureGrid';
import PremiumFeature from '../../components/features/PremiumFeature';
import Ecosystem from '../../components/common/Ecosystem';
import TrustSection from '../../components/common/TrustSection';
import ProblemSection from '../../components/common/ProblemSection';
import HowItWorks from '../../components/common/HowItWorks';
import CTASection from '../../components/cta/CTASection';

export default function Home() {
  return (
    <div className="animate-fade-in overflow-hidden">
      <Hero />
      <TrustSection />

      {/* Workforce Module */}
      <PremiumFeature
        subtitle="Workforce Intelligence"
        title="People management. Simplified for growth."
        desc="Connect your team from office to field. Business Sarthi provides the visibility you need to manage attendance, track live locations, and automate payroll with absolute precision."
        points={['GPS Verified Attendance', 'Live Staff Tracking', 'Automated Payslips', 'Leave Workflows']}
        image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070"
        reverse={false}
      />

      <Ecosystem />

      {/* Sales Module */}
      <PremiumFeature
        subtitle="Sales & Performance"
        title="Turn every sale into actionable insight."
        desc="Empower your sales team and monitor real-time performance. Set monthly targets, track individual achievements, and understand product-wise performance across your entire distributor network."
        points={['Individual Target Tracking', 'Achievement Analytics', 'Product Performance', 'Sales Force Monitoring']}
        image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
        reverse={true}
      />

      <ProblemSection />

      <FeatureGrid />

      {/* Operations Module */}
      <PremiumFeature
        subtitle="Operations & Inventory"
        title="From purchase to profit. All connected."
        desc="Maintain total control over your stock, vendors, and purchases. Business Sarthi bridges the gap between procurement and sales, ensuring you never run low on what matters."
        points={['Inventory SKU Tracking', 'Vendor Ledger Mgmt', 'Purchase Records', 'Low Stock Alerts']}
        image="https://images.unsplash.com/photo-1553413766-41f9d287af3c?auto=format&fit=crop&q=80&w=2089"
        reverse={false}
      />

      <HowItWorks />
      <CTASection />
    </div>
  );
}
