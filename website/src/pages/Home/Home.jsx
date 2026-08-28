import Hero from '../../components/hero/Hero';
import FeatureGrid from '../../components/features/FeatureGrid';
import FeatureShowcase from '../../components/features/FeatureShowcase';
import TrustSection from '../../components/common/TrustSection';
import ProblemSection from '../../components/common/ProblemSection';
import HowItWorks from '../../components/common/HowItWorks';
import CTASection from '../../components/cta/CTASection';

export default function Home() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <TrustSection />
      <ProblemSection />
      <FeatureGrid />
      <FeatureShowcase />
      <HowItWorks />
      <CTASection />
    </div>
  );
}
