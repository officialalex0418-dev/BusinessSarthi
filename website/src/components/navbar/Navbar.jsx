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
          ? 'bg-white/80 backdrop-blur-3xl border-b border-slate-200/50 py-4 shadow-sm'
          : 'bg-transparent py-10'
      )}
    >
      <div className="section-container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group relative">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-500 border border-slate-100">
             <img src="/logo.png" alt="Logo" className="h-full w-auto" />
          </div>
          <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
            Business<span className="text-primary-600">Sarthi</span>
          </span>
        </Link>

        {/* Desktop Nav - Professional visible links */}
        <div className="hidden xl:flex items-center gap-10">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:text-primary-600',
                  isActive ? 'text-primary-600' : 'text-slate-400'
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
            className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-primary-600 transition-all px-4"
          >
            Login
          </a>
          <a
            href={siteConfig.links.register}
            className="bg-slate-900 text-white hover:bg-primary-600 px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="xl:hidden p-3 text-slate-600 bg-white shadow-xl rounded-2xl border border-slate-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        'xl:hidden fixed inset-0 z-[-1] bg-white pt-32 px-10 flex flex-col gap-10 transition-all duration-500 ease-in-out',
        isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-full'
      )}>
        <div className="flex flex-col gap-6">
           {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "text-6xl font-black tracking-tighter transition-all uppercase italic",
                isActive ? "text-primary-600 translate-x-4" : "text-slate-900 hover:translate-x-4"
              )}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto pb-16 border-t border-slate-100 pt-10 flex flex-col gap-6">
          <a href={siteConfig.links.login} className="w-full py-6 rounded-3xl bg-slate-50 text-center font-black uppercase tracking-widest text-slate-900 text-lg">Login</a>
          <a href={siteConfig.links.register} className="w-full py-6 rounded-3xl bg-primary-600 text-center font-black uppercase tracking-widest text-white shadow-2xl shadow-primary-200 text-lg">Get Started</a>
        </div>
      </div>
    </nav>
  );
}
