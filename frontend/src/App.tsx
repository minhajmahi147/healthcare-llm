/**
 * Top-level route table for the SPA.
 * Patient app under ProtectedRoute + AppLayout.
 * Admin app under StaffRoute + AdminLayout.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  ProtectedRoute,
  PublicRoute,
  StaffRoute,
} from '@/components/layout/ProtectedRoute';
import { AdminCabinsPage } from '@/pages/AdminCabinsPage';
import { AdminDoctorsPage } from '@/pages/AdminDoctorsPage';
import { AdminPatientDetailPage } from '@/pages/AdminPatientDetailPage';
import { AdminPatientsPage } from '@/pages/AdminPatientsPage';
import { AdminRegisterPage } from '@/pages/AdminRegisterPage';
import { CabinsPage } from '@/pages/CabinsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DietaryPage } from '@/pages/DietaryPage';
import { HealthPlanPage } from '@/pages/HealthPlanPage';
import { HealthProfilePage } from '@/pages/HealthProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { PrescriptionPage } from '@/pages/PrescriptionPage';
import { PrescriptionResultPage } from '@/pages/PrescriptionResultPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { useAuth } from '@/context/AuthContext';

function HomeRedirect() {
  const { isAuthenticated, isStaff } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isStaff ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cabins" element={<CabinsPage />} />
          <Route path="/health-profile" element={<HealthProfilePage />} />
          <Route path="/health-plan" element={<HealthPlanPage />} />
          <Route path="/dietary" element={<DietaryPage />} />
          <Route path="/prescription" element={<PrescriptionPage />} />
          <Route path="/prescription/result/:id" element={<PrescriptionResultPage />} />
        </Route>
      </Route>

      <Route element={<StaffRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminPatientsPage />} />
          <Route path="/admin/patients/:patientId" element={<AdminPatientDetailPage />} />
          <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
          <Route path="/admin/cabins" element={<AdminCabinsPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
