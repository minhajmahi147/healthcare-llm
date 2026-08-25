/**
 * Public /register screen. Hosts RegisterForm so a new user can create an
 * account. After success AuthContext logs them in and PublicRoute redirects
 * to the dashboard.
 */
import { RegisterForm } from '@/features/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="auth-page">
      <RegisterForm />
    </div>
  );
}
