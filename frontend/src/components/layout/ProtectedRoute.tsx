/**
 * Auth gate components used in App.tsx.
 * ProtectedRoute: patient app — logged-in non-staff only.
 * StaffRoute: admin app — logged-in staff only.
 * PublicRoute: guests only; sends staff to /admin and patients to /dashboard.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isStaff } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isStaff) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function StaffRoute() {
  const { isAuthenticated, isStaff } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isStaff } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isStaff ? '/admin' : '/dashboard'} replace />;
  }
  return <Outlet />;
}
