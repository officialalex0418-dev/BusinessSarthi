import { siteConfig } from '../../config/site';

export default function RefundPolicy() {
  return (
    <div className="pt-32 pb-24">
      <div className="section-container max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-4">Refund Policy</h1>
        <p className="text-slate-500 mb-12 uppercase tracking-widest text-xs font-bold">Last Updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Subscription Cancellation</h2>
            <p>
              You may cancel your {siteConfig.name} subscription at any time through your account settings or
              by contacting our support team. Upon cancellation, your service will remain active until the
              end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Eligibility for Refund</h2>
            <p>
              We offer a 7-day money-back guarantee for new subscriptions. If you are not satisfied with our
              service, you can request a full refund within the first 7 days of your initial purchase.
            </p>
            <p className="mt-4">Refunds are not typically provided for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Partial months of service</li>
              <li>Annual subscriptions after the initial 7-day period</li>
              <li>Account terminations due to violations of our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Refund Process</h2>
            <p>
              To request a refund, please send an email to {siteConfig.contact.email} with your account
              details and reason for the request. We will process your request within 5-7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Plan Downgrades</h2>
            <p>
              If you downgrade your plan, the price difference will be applied as credit to your next
              billing cycle. No direct cash refunds are provided for plan downgrades.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
