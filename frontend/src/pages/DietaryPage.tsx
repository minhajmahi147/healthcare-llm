/**
 * /dietary page. Loads GET /health/dietary-recommendation/ and shows breakfast,
 * lunch, dinner, snacks, and foods to avoid. A 404 means no recommendation exists
 * yet (save the health profile to generate one). Other errors show as alerts.
 */
import { Link } from 'react-router-dom';
import { healthApi } from '@/api/health.api';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';
import { formatDate } from '@/utils/format';

export function DietaryPage() {
  const { data, error, status, loading } = useAsync(() => healthApi.getDietaryRecommendation(), []);
  const missing = status === 404;

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  const meals = data
    ? [
        { label: 'Breakfast', value: data.breakfast },
        { label: 'Lunch', value: data.lunch },
        { label: 'Dinner', value: data.dinner },
        { label: 'Snacks', value: data.snacks },
        { label: 'Foods to avoid', value: data.foods_to_avoid },
      ]
    : [];

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dietary Recommendations</h1>
        <p>
          {data
            ? `Last updated ${formatDate(data.created_at)}`
            : 'Meal suggestions based on your health profile.'}
        </p>
      </header>

      <Alert variant={missing ? 'info' : 'error'} message={error ?? ''} />

      {missing ? (
        <Card title="No recommendation yet">
          <p>
            Save your health profile to generate meal suggestions.{' '}
            <Link className="text-link" to="/health-profile">Go to Health Profile →</Link>
          </p>
        </Card>
      ) : null}

      {data ? (
        <div className="grid-cards">
          {meals.map((meal) => (
            <Card key={meal.label} title={meal.label}>
              <pre className="content-block">{meal.value || '—'}</pre>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
