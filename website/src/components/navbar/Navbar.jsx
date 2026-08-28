import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { cn } from '../../utils/cn';

const navLinks = [
  { name: 'Home', to: '/' },
  { name: 'Features', to: '/features' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'sticky top-0 z-[100] w-full transition-all duration-300 border-b',
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-slate-200 py-3 shadow-sm'
          : 'bg-white border-transparent py-5'
      )}
    >
      <div className="section-container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary-600',
                  isActive ? 'text-primary-600' : 'text-slate-600'
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a
            href={siteConfig.links.login}
            className="text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors"
          >
            Login
          </a>
          <a
            href={siteConfig.links.register}
            className="btn btn-primary gap-2"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 py-6 px-4 flex flex-col gap-4 animate-fade-in">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-lg font-medium py-2',
                  isActive ? 'text-primary-600' : 'text-slate-600'
                )
              }
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
            <a
              href={siteConfig.links.login}
              className="text-center font-semibold text-slate-700 py-2"
            >
              Login
            </a>
            <a
              href={siteConfig.links.register}
              className="btn btn-primary w-full py-3"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
