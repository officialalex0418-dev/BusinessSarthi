import { Link } from 'react-router-dom';
import { Home, Rocket } from 'lucide-react';
import ThreeDCard from '../components/common/ThreeDCard';
import ThreeDBackground from '../components/common/ThreeDBackground';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 relative overflow-hidden">
      <div className="text-center max-w-2xl relative z-10">
        <ThreeDCard intensity={20}>
           <h1 className="text-[12rem] lg:text-[20rem] font-black text-primary-600/10 mb-[-4rem] lg:mb-[-8rem] tracking-tighter uppercase italic select-none">404</h1>
        </ThreeDCard>

        <h2 className="text-4xl lg:text-7xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter leading-none">Lost in <br /><span className="text-primary-600">Deep Space.</span></h2>

        <p className="text-slate-500 mb-16 text-xl lg:text-2xl font-medium tracking-tight">
          The business operation you are looking for has been moved or archived.
        </p>

        <Link to="/" className="w-full sm:w-auto px-16 py-8 rounded-[2.5rem] bg-primary-600 text-white font-black uppercase tracking-[0.4em] text-sm shadow-2xl shadow-primary-200 hover:scale-[1.05] active:scale-95 transition-all inline-flex items-center justify-center gap-4">
          <Rocket className="h-5 w-5" />
          Return to Platform
        </Link>
      </div>
    </div>
  );
}
