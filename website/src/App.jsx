import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Features from './pages/Features/Features';
import Pricing from './pages/Pricing/Pricing';
import Contact from './pages/Contact/Contact';
import Security from './pages/Security/Security';
import FAQ from './pages/FAQ/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import Terms from './pages/Terms/Terms';
import RefundPolicy from './pages/RefundPolicy/RefundPolicy';
import CookiePolicy from './pages/CookiePolicy/CookiePolicy';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="contact" element={<Contact />} />
        <Route path="security" element={<Security />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-and-conditions" element={<Terms />} />
        <Route path="refund-policy" element={<RefundPolicy />} />
        <Route path="cookie-policy" element={<CookiePolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
