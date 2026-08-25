import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Button, Input, Card } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      // Even on error, we show success to prevent email enumeration
      setSent(true);
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Check your email</h1>
          <p className="mb-6 text-sm text-slate-500">
            If an account exists for <b>{email}</b>, we have sent a secure password reset link.
            Please check your inbox and follow the instructions.
          </p>
          <Link to="/login" className="text-sm font-medium text-primary-600 hover:underline">Back to login</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Forgot password</h1>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-500">Enter your account email and we'll send you a secure link to reset your password.</p>
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-primary-600 hover:underline">Back to login</Link>
        </div>
      </Card>
    </div>
  );
}
