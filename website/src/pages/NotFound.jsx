import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-black text-primary-100 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h2>
        <p className="text-slate-500 mb-10 text-lg">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary gap-2 px-8 py-4">
          <Home className="h-5 w-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
