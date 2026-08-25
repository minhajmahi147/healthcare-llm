/**
 * /health-plan page. Loads the latest HealthPlan via GET /health/plan/.
 * 404 is treated as “no plan yet” (user should save a profile first).
 * On success it shows food chart, exercise plan, and sleep plan with the
 * generated timestamp.
 */
import { Link } from 'react-router-dom';
import { healthApi } from '@/api/health.api';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';
import { formatDate } from '@/utils/format';

export function HealthPlanPage() {
  const { data, error, status, loading } = useAsync(() => healthApi.getPlan(), []);
  const missing = status === 404;

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Health Plan</h1>
        <p>AI-generated food, exercise, and sleep guidance based on your profile.</p>
      </header>

      <Alert variant={missing ? 'info' : 'error'} message={error ?? ''} />

      {missing ? (
        <Card title="No health plan yet">
          <p>
            Save your health profile to generate a plan.{' '}
            <Link className="text-link" to="/health-profile">Go to Health Profile →</Link>
          </p>
        </Card>
      ) : null}

      {data ? (
        <div className="stack">
          <Card title="Food chart" subtitle={`Generated ${formatDate(data.generated_at)}`}>
            <pre className="content-block">{data.food_chart}</pre>
          </Card>
          <Card title="Exercise plan">
            <pre className="content-block">{data.exercise_plan}</pre>
          </Card>
          <Card title="Sleep plan">
            <pre className="content-block">{data.sleep_plan || 'No sleep plan available yet.'}</pre>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
