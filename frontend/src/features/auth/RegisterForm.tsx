/**
 * Sign-up form shown on RegisterPage.
 * Collects name, username, and password, then AuthContext.register() creates
 * the Django user and immediately logs in. Errors come from the API; a link
 * points existing users to /login.
 */
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatApiError } from '@/utils/format';

export function RegisterForm() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, username, password });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Create account" subtitle="Register to get personalized health recommendations">
      <form className="stack" onSubmit={handleSubmit}>
        <Input label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <Alert variant="error" message={error} />
        <Button type="submit" loading={loading}>Create account</Button>
      </form>
      <p className="auth-footer">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  );
}
