import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Features', to: '/features' },
      { name: 'Pricing', to: '/pricing' },
      { name: 'Security', to: '/security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About', to: '/about' },
      { name: 'Contact', to: '/contact' },
      { name: 'Careers', to: '/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', to: '/privacy-policy' },
      { name: 'Terms & Conditions', to: '/terms-and-conditions' },
      { name: 'Refund Policy', to: '/refund-policy' },
      { name: 'Cookie Policy', to: '/cookie-policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-slate-500 max-w-xs mb-6">
              Empowering modern businesses with powerful, cloud-based tools for management and growth.
              {siteConfig.tagline}
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-slate-900 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {/* Social icons placeholder */}
            <span className="text-xs text-slate-400 uppercase tracking-widest">
              Driving Business Forward
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
