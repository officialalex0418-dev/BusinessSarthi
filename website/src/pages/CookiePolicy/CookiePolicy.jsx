import { siteConfig } from '../../config/site';

export default function CookiePolicy() {
  return (
    <div className="pt-32 pb-24">
      <div className="section-container max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-4">Cookie Policy</h1>
        <p className="text-slate-500 mb-12 uppercase tracking-widest text-xs font-bold">Last Updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website.
              They are widely used to make websites work, or work more efficiently, as well as to provide
              information to the owners of the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Cookies</h2>
            <p>We use cookies for several reasons:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Essential Cookies:</strong> Required for you to log in and use our SaaS application securely.</li>
              <li><strong>Preference Cookies:</strong> Used to remember your settings (like dark mode or language).</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Managing Cookies</h2>
            <p>
              Most web browsers allow some control of most cookies through the browser settings. You can choose
              to block or delete cookies, but this may prevent you from using certain parts of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Third-Party Cookies</h2>
            <p>
              In some cases, we use cookies provided by trusted third parties such as Google Analytics to
              help us understand how you use the site and ways that we can improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. More Information</h2>
            <p>
              Hopefully that has clarified things for you. If you are looking for more information,
              you can contact us through one of our preferred contact methods:
            </p>
            <p className="mt-4 font-bold text-slate-900">{siteConfig.contact.email}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
