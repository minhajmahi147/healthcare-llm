/**
 * Auth gate components used in App.tsx.
 * ProtectedRoute: if there is no user in AuthContext, redirect to /login;
 * otherwise render nested authenticated routes.
 * PublicRoute: if already logged in, skip /login and /register and go to /dashboard.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
