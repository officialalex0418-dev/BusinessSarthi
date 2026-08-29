import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Features', to: '/features' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Security', to: '/security' },
  { name: 'FAQ', to: '/faq' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 z-[100] w-full transition-all duration-500',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-4 shadow-sm'
          : 'bg-transparent py-8'
      )}
    >
      <div className="section-container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group relative">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto transition-transform duration-500 group-hover:scale-110" />
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Business<span className="text-primary-600">Sarthi</span>
          </span>
        </Link>

        {/* Desktop Nav - Direct visible links */}
        <div className="hidden xl:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-primary-600',
                  isActive ? 'text-primary-600 border-b-2 border-primary-600 pb-1' : 'text-slate-500'
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <a
            href={siteConfig.links.login}
            className="text-xs font-black uppercase tracking-widest text-slate-700 hover:text-primary-600 transition-all px-4"
          >
            Login
          </a>
          <a
            href={siteConfig.links.register}
            className="bg-slate-900 text-white hover:bg-primary-600 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-slate-600 bg-slate-50 rounded-2xl border border-slate-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        'lg:hidden fixed inset-0 z-[-1] bg-white pt-24 px-6 flex flex-col gap-6 transition-all duration-500 ease-in-out',
        isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-full'
      )}>
        <div className="flex flex-col gap-2">
           {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "text-4xl font-black tracking-tighter transition-all",
                isActive ? "text-primary-600 translate-x-2" : "text-slate-900 hover:translate-x-2"
              )}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto pb-12 border-t border-slate-100 pt-8 flex flex-col gap-4">
          <a href={siteConfig.links.login} className="w-full py-5 rounded-3xl bg-slate-50 text-center font-black uppercase tracking-widest text-slate-900">Login</a>
          <a href={siteConfig.links.register} className="w-full py-5 rounded-3xl bg-primary-600 text-center font-black uppercase tracking-widest text-white shadow-2xl shadow-primary-200">Get Started</a>
        </div>
      </div>
    </nav>
  );
}
