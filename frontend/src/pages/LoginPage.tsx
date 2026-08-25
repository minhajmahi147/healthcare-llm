/**
 * Public /login screen. Only layout: a centered page that hosts LoginForm.
 * Routing (guest-only) is handled by PublicRoute in App.tsx.
 */
import { LoginForm } from '@/features/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  );
}
