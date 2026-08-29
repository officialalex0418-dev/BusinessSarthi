import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { cn } from '../../utils/cn';

const navItems = [
  {
    name: 'Product',
    dropdown: [
      { name: 'People Management', to: '/features#people' },
      { name: 'Sales & Targets', to: '/features#sales' },
      { name: 'Operations & Inventory', to: '/features#ops' },
      { name: 'Analytics & Reports', to: '/features#analytics' },
    ]
  },
  {
    name: 'Pricing',
    to: '/pricing'
  },
  {
    name: 'Resources',
    dropdown: [
      { name: 'About Us', to: '/about' },
      { name: 'Contact', to: '/contact' },
      { name: 'Security', to: '/security' },
      { name: 'FAQ', to: '/faq' },
    ]
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

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
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3 shadow-sm'
          : 'bg-transparent border-b border-transparent py-6'
      )}
    >
      <div className="section-container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group relative">
          <div className="absolute -inset-2 bg-primary-100 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
          <img src="/logo.png" alt="Logo" className="h-9 w-auto relative transition-transform duration-500 group-hover:rotate-12" />
          <span className="text-2xl font-black tracking-tight text-slate-900 relative">
            Business<span className="text-primary-600">Sarthi</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative group"
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {item.to ? (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-semibold transition-all hover:text-primary-600 flex items-center gap-1',
                      isActive ? 'text-primary-600' : 'text-slate-600'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ) : (
                <button className="text-sm font-semibold text-slate-600 hover:text-primary-600 flex items-center gap-1 transition-all">
                  {item.name}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', activeDropdown === item.name && 'rotate-180')} />
                </button>
              )}

              {item.dropdown && (
                <div className={cn(
                  'absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 invisible opacity-0 translate-y-2',
                  activeDropdown === item.name && 'visible opacity-100 translate-y-0'
                )}>
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[200px] preserve-3d">
                    {item.dropdown.map(sub => (
                      <Link
                        key={sub.name}
                        to={sub.to}
                        className="block px-4 py-3 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a
            href={siteConfig.links.login}
            className="text-sm font-bold text-slate-700 hover:text-primary-600 transition-all px-4"
          >
            Login
          </a>
          <a
            href={siteConfig.links.register}
            className="btn btn-primary px-7 py-3 rounded-full gap-2 shadow-lg shadow-primary-200"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600 bg-slate-50 rounded-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu (Updated) */}
      <div className={cn(
        'md:hidden fixed inset-x-0 top-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 transition-all duration-500 ease-in-out origin-top',
        isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 invisible'
      )}>
        {navItems.map((item) => (
          <div key={item.name} className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.name}</p>
            {item.dropdown ? (
              <div className="grid grid-cols-1 gap-2">
                {item.dropdown.map(sub => (
                  <Link key={sub.name} to={sub.to} onClick={() => setIsOpen(false)} className="text-lg font-bold text-slate-700">
                    {sub.name}
                  </Link>
                ))}
              </div>
            ) : (
              <Link to={item.to} onClick={() => setIsOpen(false)} className="text-lg font-bold text-slate-700">
                {item.name}
              </Link>
            )}
          </div>
        ))}
        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
          <a href={siteConfig.links.login} className="btn btn-outline w-full py-4 rounded-2xl">Login</a>
          <a href={siteConfig.links.register} className="btn btn-primary w-full py-4 rounded-2xl shadow-xl shadow-primary-100">Get Started</a>
        </div>
      </div>
    </nav>
  );
}
