/**
 * Top-level route table for the SPA.
 *
 * Public routes (/login, /register) are wrapped in PublicRoute so logged-in
 * users are sent to the dashboard. All feature pages sit under ProtectedRoute
 * + AppLayout (nav bar). Unknown URLs and `/` redirect to /dashboard.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from '@/components/layout/ProtectedRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { DietaryPage } from '@/pages/DietaryPage';
import { HealthPlanPage } from '@/pages/HealthPlanPage';
import { HealthProfilePage } from '@/pages/HealthProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { PrescriptionPage } from '@/pages/PrescriptionPage';
import { PrescriptionResultPage } from '@/pages/PrescriptionResultPage';
import { RegisterPage } from '@/pages/RegisterPage';

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
          <Route path="/health-profile" element={<HealthProfilePage />} />
          <Route path="/health-plan" element={<HealthPlanPage />} />
          <Route path="/dietary" element={<DietaryPage />} />
          <Route path="/prescription" element={<PrescriptionPage />} />
          <Route path="/prescription/result/:id" element={<PrescriptionResultPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
