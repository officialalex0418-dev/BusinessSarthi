import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
