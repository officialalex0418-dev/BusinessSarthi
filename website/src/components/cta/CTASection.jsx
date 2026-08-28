import { siteConfig } from '../../config/site';

export default function CTASection() {
  return (
    <section className="py-24 bg-primary-600">
      <div className="section-container text-center text-white">
        <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl mb-6">
          Ready to drive your business forward?
        </h2>
        <p className="text-primary-100 text-xl max-w-2xl mx-auto mb-10">
          Join hundreds of companies that use Business Sarthi to manage their operations,
          empower their teams, and accelerate growth.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href={siteConfig.links.register} className="btn bg-white text-primary-600 hover:bg-primary-50 text-lg px-10 py-4 w-full sm:w-auto">
            Get Started Now
          </a>
          <a href="/contact" className="btn border border-white text-white hover:bg-white/10 text-lg px-10 py-4 w-full sm:w-auto">
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  );
}
