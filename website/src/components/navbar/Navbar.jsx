import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown, Rocket } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { cn } from '../../utils/cn';

const navLinks = [
  { name: 'Features', to: '/features' },
  { name: 'Solutions', to: '/solutions' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Security', to: '/security' },
  { name: 'FAQ', to: '/faq' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 z-[100] w-full transition-all duration-700',
        scrolled
          ? 'bg-white/90 backdrop-blur-3xl border-b border-slate-200/50 py-5 shadow-2xl shadow-primary-900/5'
          : 'bg-transparent py-12'
      )}
    >
      <div className="w-full px-6 sm:px-12 lg:px-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group relative">
          <div className="h-14 w-14 rounded-2xl bg-white shadow-2xl flex items-center justify-center p-2.5 group-hover:scale-110 transition-transform duration-700 border border-slate-100/50">
             <img src="/logo.png" alt="Logo" className="h-full w-auto" />
          </div>
          <div className="flex flex-col -gap-1">
            <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
              Business<span className="text-primary-600">Sarthi</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-400 mt-1">Enterprise Platform</span>
          </div>
        </Link>

        {/* Desktop Nav - High-end Visible Links */}
        <div className="hidden xl:flex items-center gap-12">
          {navLinks.map((item) => (
            <div
              key={item.name}
              className="relative group"
              onMouseEnter={() => setActiveMenu(item.name)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              {item.dropdown ? (
                <button className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-primary-600 transition-all flex items-center gap-2">
                  {item.name}
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-500", activeMenu === item.name && "rotate-180")} />
                </button>
              ) : (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-[10px] font-black uppercase tracking-[0.5em] transition-all hover:text-primary-600 relative py-2',
                      isActive ? 'text-primary-600' : 'text-slate-400'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.name}
                      {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-full animate-in fade-in zoom-in duration-500" />}
                    </>
                  )}
                </NavLink>
              )}

              {item.dropdown && (
                <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-6 transition-all duration-500",
                  activeMenu === item.name ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"
                )}>
                   <div className="glass p-3 rounded-[2.5rem] shadow-3d border border-slate-100 min-w-[240px] preserve-3d">
                      {item.dropdown.map(sub => (
                        <Link
                          key={sub.name}
                          to={sub.to}
                          className="flex items-center justify-between px-6 py-4 rounded-3xl hover:bg-primary-600 hover:text-white transition-all group/sub"
                        >
                           <span className="text-xs font-black uppercase tracking-widest">{sub.name}</span>
                           <ArrowRight className="h-4 w-4 opacity-0 -translate-x-4 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all" />
                        </Link>
                      ))}
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <a
            href={siteConfig.links.login}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 hover:text-primary-600 transition-all px-4"
          >
            Access
          </a>
          <a
            href={siteConfig.links.register}
            className="btn btn-primary px-10 py-5 rounded-3xl group"
          >
            Get Started
            <Rocket className="h-4 w-4 ml-3 group-hover:rotate-12 transition-transform" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="xl:hidden h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-slate-600 border border-slate-100 active:scale-90 transition-transform"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu - Immersive Fullscreen */}
      <div className={cn(
        'xl:hidden fixed inset-0 z-[-1] bg-white pt-40 px-10 flex flex-col gap-10 transition-all duration-700 ease-in-out',
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      )}>
        <div className="flex flex-col gap-4">
           {navLinks.filter(l => !l.dropdown).map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "text-7xl font-black tracking-tighter transition-all uppercase italic leading-none",
                isActive ? "text-primary-600 translate-x-6" : "text-slate-900 hover:translate-x-6"
              )}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto pb-20 flex flex-col gap-6">
          <a href={siteConfig.links.register} className="w-full py-8 rounded-[3rem] bg-primary-600 text-center font-black uppercase tracking-[0.4em] text-white shadow-2xl shadow-primary-200 text-xl">Deploy Sarthi</a>
          <div className="flex justify-between items-center px-4">
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">© 2026 Business Sarthi</span>
             <a href={siteConfig.links.login} className="text-xs font-black uppercase tracking-[0.4em] text-slate-900">Login →</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
