import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown, Rocket } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { cn } from '../../utils/cn';

const navLinks = [
  {
    name: 'FEATURES & SOLUTIONS',
    dropdown: [
      { name: 'Capabilities', to: '/features' },
      { name: 'Solutions', to: '/solutions' },
    ]
  },
  { name: 'PRICING', to: '/pricing' },
  { name: 'SECURITY', to: '/security' },
  {
    name: 'RESOURCES & SUPPORT',
    dropdown: [
      { name: 'FAQ', to: '/faq' },
      { name: 'Contact Us', to: '/contact' },
    ]
  },
  { name: 'ABOUT', to: '/about' },
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
          ? 'bg-white/90 backdrop-blur-3xl border-b border-slate-200/50 py-4 shadow-2xl shadow-primary-900/5'
          : 'bg-transparent py-10'
      )}
    >
      <div className="w-full px-6 sm:px-12 lg:px-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-4 group relative shrink-0">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-2xl flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-700 border border-white/50 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent" />
             <img src="/logo.png" alt="Logo" className="h-full w-auto relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none flex items-center gap-1">
              BUSINESS<span className="text-primary-600 font-black italic">SARTHI</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1.5 ml-0.5">Enterprise Platform</span>
          </div>
        </Link>

        {/* Desktop Nav - Matching Reference */}
        <div className="hidden xl:flex items-center gap-8">
          {navLinks.map((item) => (
            <div
              key={item.name}
              className="relative group h-full flex items-center"
              onMouseEnter={() => setActiveMenu(item.name)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              {item.dropdown ? (
                <div className="flex flex-col items-center relative py-4">
                  <button className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-primary-600 transition-all flex items-center gap-1">
                    {item.name}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-500 opacity-60", activeMenu === item.name && "rotate-180 opacity-100")} />
                  </button>
                  <div className={cn(
                    "absolute bottom-2 left-0 h-[1px] bg-slate-400/50 transition-all duration-500 w-full group-hover:bg-primary-600 group-hover:h-[1.5px]"
                  )} />
                </div>
              ) : (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-primary-600 relative py-4 block',
                      isActive ? 'text-primary-600' : 'text-slate-600'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.name}
                      <div className={cn(
                        "absolute bottom-2 left-0 h-[1px] bg-slate-400/30 transition-all duration-500 w-full group-hover:bg-primary-600 group-hover:h-[1.5px]",
                        isActive && "bg-primary-600 h-[1.5px]"
                      )} />
                    </>
                  )}
                </NavLink>
              )}

              {item.dropdown && (
                <div className={cn(
                  "absolute top-full left-0 pt-2 transition-all duration-500",
                  activeMenu === item.name ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"
                )}>
                   <div className="glass p-3 rounded-2xl shadow-3d border border-slate-100 min-w-[220px]">
                      {item.dropdown.map(sub => (
                        <Link
                          key={sub.name}
                          to={sub.to}
                          className="flex items-center justify-between px-5 py-3 rounded-xl hover:bg-primary-600 hover:text-white transition-all group/sub"
                        >
                           <span className="text-[11px] font-black uppercase tracking-widest">{sub.name}</span>
                           <ArrowRight className="h-4 w-4 opacity-0 -translate-x-4 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all" />
                        </Link>
                      ))}
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons - Matching Reference */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          <a
            href={siteConfig.links.login}
            className="px-10 py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] text-slate-800 bg-gradient-to-b from-white to-slate-100 border border-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center min-w-[140px] hover:border-slate-400"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 2px 4px rgba(0,0,0,0.1)' }}
          >
            ACCESS
          </a>
          <a
            href={siteConfig.links.register}
            className="relative group flex items-center"
          >
            {/* Animated Trail Effect */}
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-24 h-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-visible">
               <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                  <path
                    d="M0,30 Q30,30 40,10 T100,10"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-dash"
                  />
                  <Rocket className="h-4 w-4 text-primary-400 absolute top-0 left-0" style={{ transform: 'rotate(45deg)' }} />
               </svg>
            </div>

            <div className="px-10 py-4 rounded-xl bg-gradient-to-b from-primary-50 to-primary-100 border border-primary-300 text-primary-900 font-black uppercase tracking-[0.1em] text-[13px] shadow-[0_4px_20px_rgba(37,99,235,0.1)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.02] flex items-center gap-3 active:scale-95 group">
               Get Started
               <Rocket className="h-5 w-5 text-primary-600 group-hover:rotate-12 transition-transform" />
            </div>
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

      {/* Mobile Menu - Improved */}
      <div className={cn(
        'xl:hidden fixed inset-0 z-[-1] bg-white/95 backdrop-blur-xl pt-40 px-10 flex flex-col gap-10 transition-all duration-700 ease-in-out',
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      )}>
        <div className="flex flex-col gap-6">
           {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.to || item.dropdown?.[0].to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "text-5xl font-black tracking-tighter transition-all uppercase italic leading-none",
                isActive ? "text-primary-600 translate-x-4" : "text-slate-900 hover:translate-x-4"
              )}
            >
              {item.name.split(' ')[0]}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto pb-20 flex flex-col gap-6">
          <a href={siteConfig.links.register} className="w-full py-8 rounded-[2rem] bg-primary-600 text-center font-black uppercase tracking-[0.4em] text-white shadow-2xl shadow-primary-200 text-xl">Get Started Now</a>
          <div className="flex justify-between items-center px-4">
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">© 2026 Business Sarthi</span>
             <a href={siteConfig.links.login} className="text-sm font-black uppercase tracking-[0.4em] text-slate-900">Login →</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
