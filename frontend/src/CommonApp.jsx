import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import { getRoleHome } from '@/lib/utils';
import SplashScreen from '@/components/SplashScreen/SplashScreen';

import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import ChangePassword from '@/pages/auth/ChangePassword';

export default function CommonApp() {
  const { user, loading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  if (loading || !splashFinished) {
    return <SplashScreen isAppReady={!loading} onFinished={() => setSplashFinished(true)} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getRoleHome(user)} /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="*" element={<Navigate to={user ? getRoleHome(user) : '/login'} replace />} />
    </Routes>
  );
}
