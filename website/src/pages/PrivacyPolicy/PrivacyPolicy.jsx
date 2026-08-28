import { siteConfig } from '../../config/site';

export default function PrivacyPolicy() {
  return (
    <div className="pt-32 pb-24">
      <div className="section-container max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-4">Privacy Policy</h1>
        <p className="text-slate-500 mb-12 uppercase tracking-widest text-xs font-bold">Last Updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p>
              Welcome to {siteConfig.name}. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you visit our website
              (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. The Data We Collect</h2>
            <p>Personal data, or personal information, means any information about an individual from which that person can be identified.</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Identity Data:</strong> name, username, roles.</li>
              <li><strong>Contact Data:</strong> email address, telephone numbers.</li>
              <li><strong>Technical Data:</strong> internet protocol (IP) address, login data, browser type and version.</li>
              <li><strong>Location Data:</strong> GPS-based location tracking (for staff users only during active shifts).</li>
              <li><strong>Usage Data:</strong> information about how you use our platform and services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>To provide the SaaS services requested by your company.</li>
              <li>To enable location tracking features for workforce management.</li>
              <li>To manage your account and provide customer support.</li>
              <li>To comply with legal or regulatory obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Location Tracking Specifics</h2>
            <p>
              {siteConfig.name} provides employee location tracking as a core feature. This data is collected strictly
              for business operational purposes defined by your employer. We do not sell this data to third parties.
              Tracking is typically enabled only during working hours or shifts as configured by the company administrator.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally
              lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to
              your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Contact Us</h2>
            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
            <p className="mt-4 font-bold text-slate-900">{siteConfig.contact.email}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
