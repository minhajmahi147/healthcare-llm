/**
 * Sign-in form shown on LoginPage.
 * After login, PublicRoute sends staff to /admin and patients to /dashboard.
 */
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatApiError } from '@/utils/format';

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Welcome back"
      subtitle="Patients manage their own plans. Staff open the admin console."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <Input
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Alert variant="error" message={error} />
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="auth-footer">
        New patient? <Link to="/register">Create an account</Link>
      </p>
    </Card>
  );
}
