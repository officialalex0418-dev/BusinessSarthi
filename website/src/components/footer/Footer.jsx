import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook, Instagram, Linkedin, Youtube,
  ArrowRight, ChevronLeft, ChevronRight, Video,
  Play
} from 'lucide-react';
import { siteConfig } from '../../config/site';
import { getPublicProducts } from '../../services/api';
import { cn } from '../../utils/cn';
import ThreeDCard from '../common/ThreeDCard';

const ALL_PAGES = [
  { name: 'Home', to: '/' },
  { name: 'Features', to: '/features' },
  { name: 'Solutions', to: '/solutions' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Security', to: '/security' },
  { name: 'FAQ', to: '/faq' },
];

const POLICIES = [
  { name: 'Privacy Policy', to: '/privacy-policy' },
  { name: 'Terms & Conditions', to: '/terms-conditions' },
  { name: 'Refund Policy', to: '/refund-policy' },
  { name: 'Cookie Policy', to: '/cookie-policy' },
];

const COMPANY = [
  { name: 'About Us', to: '/about' },
  { name: 'Contact Us', to: '/contact' },
];

export default function Footer() {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getPublicProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const nextProduct = useCallback(() => {
    if (products.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % products.length);
  }, [products.length]);

  const prevProduct = useCallback(() => {
    if (products.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  useEffect(() => {
    if (!isPaused && products.length > 1) {
      timerRef.current = setInterval(nextProduct, 6000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPaused, products.length, nextProduct]);

  return (
    <footer className="bg-slate-900 pt-20 pb-8 overflow-hidden relative border-t border-white/5">
      {/* Background radial glow */}
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-primary-600/5 blur-[100px] -z-10" />

      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

          {/* LEFT: Brand Section */}
          <div className="lg:col-span-3 space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center p-2 shadow-lg shadow-primary-900/50">
                 <img src="/logo.png" alt="Logo" className="h-full w-auto brightness-0 invert" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white uppercase italic leading-none">
                Business<span className="text-primary-500">Sarthi</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
              Complete business management and workforce intelligence platform.
            </p>
            <div className="flex gap-3">
               {[
                 { icon: Facebook, href: siteConfig.links.facebook },
                 { icon: Instagram, href: siteConfig.links.instagram || '#' },
                 { icon: Linkedin, href: siteConfig.links.linkedin },
                 { icon: Youtube, href: siteConfig.links.youtube || '#' }
               ].filter(s => s.href && s.href !== '#').map((s, i) => (
                 <a
                   key={i}
                   href={s.href}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-primary-400 hover:border-primary-500/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:-translate-y-1 transition-all"
                 >
                    <s.icon className="h-4 w-4" />
                 </a>
               ))}
            </div>
          </div>

          {/* CENTER: Links */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-4">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">All Pages</h3>
              <ul className="space-y-3">
                {ALL_PAGES.map((l) => (
                  <li key={l.name}>
                    <Link to={l.to} className="text-[13px] font-bold text-slate-500 hover:text-primary-400 transition-colors inline-flex items-center group">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Policies</h3>
              <ul className="space-y-3">
                {POLICIES.map((l) => (
                  <li key={l.name}>
                    <Link to={l.to} className="text-[13px] font-bold text-slate-500 hover:text-primary-400 transition-colors inline-flex items-center group">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Company</h3>
              <ul className="space-y-3">
                {COMPANY.map((l) => (
                  <li key={l.name}>
                    <Link to={l.to} className="text-[13px] font-bold text-slate-500 hover:text-primary-400 transition-colors inline-flex items-center group">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT: Products of RCS */}
          <div className="lg:col-span-4 lg:pl-8 border-l border-white/5">
             <div className="space-y-6" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] opacity-40">Products of RCS</h3>
                   {products.length > 1 && (
                     <div className="flex gap-2">
                        <button onClick={prevProduct} className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-primary-600 hover:text-white transition-all">
                           <ChevronLeft className="h-3 w-3" />
                        </button>
                        <button onClick={nextProduct} className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-primary-600 hover:text-white transition-all">
                           <ChevronRight className="h-3 w-3" />
                        </button>
                     </div>
                   )}
                </div>

                {loading ? (
                  <div className="space-y-4 animate-pulse">
                     <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10" />
                     <div className="h-4 w-1/2 bg-white/5 rounded-full" />
                     <div className="h-2 w-full bg-white/5 rounded-full" />
                  </div>
                ) : products.length > 0 ? (
                  <div className="relative overflow-hidden group">
                     {/* Product Item */}
                     <div
                       key={products[currentIndex]._id}
                       className="animate-in fade-in slide-in-from-right-4 duration-700 space-y-4"
                     >
                        <ThreeDCard intensity={10} className="w-full">
                           <div className="aspect-video w-full rounded-2xl bg-slate-800 border border-white/10 overflow-hidden shadow-2xl relative">
                              {products[currentIndex].mediaType === 'video' ? (
                                <video
                                  src={products[currentIndex].mediaUrl}
                                  muted autoPlay loop playsInline
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <img
                                  src={products[currentIndex].mediaUrl}
                                  alt={products[currentIndex].name}
                                  className="h-full w-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
                           </div>
                        </ThreeDCard>

                        <div className="space-y-1">
                           <h4 className="text-sm font-black text-white uppercase tracking-wider leading-none italic">{products[currentIndex].name}</h4>
                           <p className="text-slate-500 text-[11px] font-medium leading-relaxed line-clamp-2">
                             {products[currentIndex].description}
                           </p>
                        </div>

                        <a
                          href={products[currentIndex].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 border-b border-primary-400/20 pb-1 hover:text-primary-300 hover:gap-4 transition-all"
                        >
                           Explore Product <ArrowRight className="h-3 w-3" />
                        </a>
                     </div>

                     {/* Indicators */}
                     {products.length > 1 && (
                       <div className="flex gap-1.5 pt-4">
                          {products.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentIndex(i)}
                              className={cn(
                                "h-1 rounded-full transition-all duration-500",
                                currentIndex === i ? "w-6 bg-primary-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "w-2 bg-white/10 hover:bg-white/20"
                              )}
                            />
                          ))}
                       </div>
                     )}
                  </div>
                ) : null}
             </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
               © {new Date().getFullYear()} Business Sarthi. Proudly built with ♥ in Nepal.
             </p>
             <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none pt-1">
               AN RCS TECHNOLOGY ECOSYSTEM
             </p>
          </div>

          <div className="flex items-center gap-8">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] animate-pulse">
              DRIVING BUSINESS FORWARD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
