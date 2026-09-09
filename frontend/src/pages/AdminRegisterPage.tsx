/**
 * /admin/register — create another staff user (requires current staff JWT).
 */
import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatApiError } from '@/utils/format';

export function AdminRegisterPage() {
  const { registerAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await registerAdmin({
        username,
        password,
        email: email || undefined,
      });
      setSuccess(`Admin "${username}" registered. They can sign in on /login.`);
      setUsername('');
      setPassword('');
      setEmail('');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Register admin</h1>
        <p>Create another staff account. Only existing admins can do this.</p>
      </header>

      <Card title="New staff user">
        <form className="stack" onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Email (optional)"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Alert variant="error" message={error} />
          <Alert variant="success" message={success} />
          <Button type="submit" loading={loading}>
            Create admin
          </Button>
        </form>
      </Card>
    </div>
  );
}
