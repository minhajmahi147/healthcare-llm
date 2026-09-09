/**
 * /admin/patients/:id — one patient's profile, food chart, and diet.
 */
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '@/api/admin.api';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';
import { formatDate } from '@/utils/format';

export function AdminPatientDetailPage() {
  const { patientId } = useParams();
  const id = Number(patientId);

  const { data, error, loading, status } = useAsync(
    () => adminApi.getPatient(id),
    [id],
  );

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="page">
        <Alert variant="error" message="Invalid patient id." />
        <Link className="text-link" to="/admin">
          ← Back to patients
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  if (status === 404 || !data) {
    return (
      <div className="page">
        <Alert variant="error" message={error || 'Patient not found.'} />
        <Link className="text-link" to="/admin">
          ← Back to patients
        </Link>
      </div>
    );
  }

  const { patient, health_profile, health_plan, dietary_recommendation } = data;

  return (
    <div className="page">
      <header className="page-header">
        <p>
          <Link className="text-link" to="/admin">
            ← Patients
          </Link>
        </p>
        <h1>{patient.name}</h1>
        <p>
          ID {patient.patient_id}
          {patient.username ? ` · @${patient.username}` : ''}
          {patient.email ? ` · ${patient.email}` : ''}
        </p>
      </header>

      <Alert variant="error" message={error ?? ''} />

      <div className="stack">
        <Card title="Health profile">
          {!health_profile ? (
            <p className="muted">No health profile saved.</p>
          ) : (
            <dl className="detail-grid">
              <div>
                <dt>Age</dt>
                <dd>{health_profile.age}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{health_profile.weight} kg</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>
                  {health_profile.height_feet} ft {health_profile.height_inches} in
                </dd>
              </div>
              <div>
                <dt>BMI</dt>
                <dd>{health_profile.bmi ?? '—'}</dd>
              </div>
              <div className="detail-span">
                <dt>Disease</dt>
                <dd>{health_profile.disease || '—'}</dd>
              </div>
              <div className="detail-span">
                <dt>Additional info</dt>
                <dd>{health_profile.addition_info || '—'}</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card
          title="Health plan / food chart"
          subtitle={
            health_plan
              ? `Generated ${formatDate(health_plan.generated_at)}`
              : undefined
          }
        >
          {!health_plan ? (
            <p className="muted">No health plan yet.</p>
          ) : (
            <div className="stack">
              <div>
                <h3 className="section-label">Food chart</h3>
                <pre className="content-block">{health_plan.food_chart}</pre>
              </div>
              <div>
                <h3 className="section-label">Exercise</h3>
                <pre className="content-block">{health_plan.exercise_plan}</pre>
              </div>
              <div>
                <h3 className="section-label">Sleep</h3>
                <pre className="content-block">
                  {health_plan.sleep_plan || 'No sleep plan.'}
                </pre>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Dietary recommendation"
          subtitle={
            dietary_recommendation
              ? `Created ${formatDate(dietary_recommendation.created_at)}`
              : undefined
          }
        >
          {!dietary_recommendation ? (
            <p className="muted">No dietary recommendation yet.</p>
          ) : (
            <div className="stack">
              <div>
                <h3 className="section-label">Breakfast</h3>
                <pre className="content-block">{dietary_recommendation.breakfast}</pre>
              </div>
              <div>
                <h3 className="section-label">Lunch</h3>
                <pre className="content-block">{dietary_recommendation.lunch}</pre>
              </div>
              <div>
                <h3 className="section-label">Dinner</h3>
                <pre className="content-block">{dietary_recommendation.dinner}</pre>
              </div>
              <div>
                <h3 className="section-label">Snacks</h3>
                <pre className="content-block">
                  {dietary_recommendation.snacks || '—'}
                </pre>
              </div>
              <div>
                <h3 className="section-label">Foods to avoid</h3>
                <pre className="content-block">
                  {dietary_recommendation.foods_to_avoid || '—'}
                </pre>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
