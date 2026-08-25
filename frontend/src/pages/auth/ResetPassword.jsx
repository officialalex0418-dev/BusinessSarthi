import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Button, Input, Card } from '@/components/ui';

export default function ResetPassword() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: '',
    confirm: '',
  });

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
      return;
    }

    const verifyToken = async () => {
      try {
        await api.get(`/auth/verify-reset-token/${token}`);
        setValid(true);
      } catch (err) {
        setError(err.response?.data?.message || 'The reset link is invalid or has expired.');
        setValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setLoading(true); setError('');
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-primary-700 to-primary-900" />
        <div className="auth-page-root relative flex min-h-screen items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-y-auto">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-slate-500">Verifying reset link...</p>
        </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-primary-700 to-primary-900" />
      <div className="auth-page-root relative flex min-h-screen items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-y-auto">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
          {valid ? 'Set New Password' : 'Invalid Link'}
        </h1>

        {message && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-600">{message}</div>}
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

        {valid ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-slate-500">Enter your new strong password.</p>
            <Input
              label="New Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              label="Confirm Password"
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
            <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
          </form>
        ) : (
          <div className="mt-4 text-center">
            <Link to="/forgot-password" size="sm" className="text-primary-600 hover:underline">
              Request a new reset link
            </Link>
          </div>
        )}
      </Card>
      </div>
    </>
  );
}
