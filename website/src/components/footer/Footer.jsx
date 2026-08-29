import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { name: 'Features', to: '/features' },
      { name: 'Solutions', to: '/solutions' },
      { name: 'Pricing', to: '/pricing' },
      { name: 'Security', to: '/security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', to: '/about' },
      { name: 'FAQ', to: '/faq' },
      { name: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', to: '/privacy-policy' },
      { name: 'Terms & Conditions', to: '/terms-conditions' },
      { name: 'Refund Policy', to: '/refund-policy' },
      { name: 'Cookie Policy', to: '/cookie-policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 pt-32 pb-12 overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-primary-600/10 blur-[150px] -z-10" />

      <div className="section-container">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center p-2">
                 <img src="/logo.png" alt="Logo" className="h-full w-auto brightness-0 invert" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white uppercase italic">
                Business<span className="text-primary-400">Sarthi</span>
              </span>
            </Link>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xs">
              Complete business management and workforce intelligence platform.
            </p>
            <div className="flex gap-4">
               {/* Social placeholders */}
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-primary-500 transition-all cursor-pointer">
                    <div className="h-1 w-4 bg-current rounded-full" />
                 </div>
               ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-6">
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm font-medium text-slate-500 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm text-slate-600 font-medium">
            © {new Date().getFullYear()} {siteConfig.name}. Build with ♥ in Nepal.
          </p>
          <div className="flex items-center gap-10">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
              Driving Business Forward
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
