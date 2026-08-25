/**
 * Logged-in home at /dashboard.
 * Greets the current username and shows cards linking to Health Profile,
 * Health Plan, Dietary Recommendations, and Prescription Upload.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';

const quickLinks = [
  {
    to: '/health-profile',
    title: 'Health Profile',
    description: 'Update age, weight, height, and medical conditions.',
  },
  {
    to: '/health-plan',
    title: 'Health Plan',
    description: 'View AI-generated food, exercise, and sleep plans.',
  },
  {
    to: '/dietary',
    title: 'Dietary Recommendations',
    description: 'See meal suggestions tailored to your profile.',
  },
  {
    to: '/prescription',
    title: 'Prescription Upload',
    description: 'Upload PDF prescriptions for automated processing.',
  },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Hello, {user?.username}</h1>
        <p>Manage your health profile, plans, and prescriptions from one place.</p>
      </header>

      <div className="grid-cards">
        {quickLinks.map((link) => (
          <Card key={link.to} title={link.title} subtitle={link.description}>
            <Link className="text-link" to={link.to}>Open →</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
