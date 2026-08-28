import { siteConfig } from '../../config/site';

export default function Terms() {
  return (
    <div className="pt-32 pb-24">
      <div className="section-container max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-4">Terms & Conditions</h1>
        <p className="text-slate-500 mb-12 uppercase tracking-widest text-xs font-bold">Last Updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using {siteConfig.name}, you agree to be bound by these Terms and Conditions.
              If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
            <p>
              {siteConfig.name} is a cloud-based business management software provided as a Service (SaaS).
              Features include employee management, attendance tracking, sales monitoring, inventory management,
              and payroll automation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must register for an account. You are responsible
              for maintaining the confidentiality of your account credentials and for all activities that
              occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Acceptable Use</h2>
            <p>You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Subscription and Payment</h2>
            <p>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on
              a recurring and periodic basis (monthly or annually) depending on the plan you select.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
            <p>
              In no event shall {siteConfig.name}, nor its directors, employees, partners, agents, suppliers,
              or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of Nepal.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
