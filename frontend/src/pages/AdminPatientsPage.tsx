/**
 * /admin — list all patients for staff.
 */
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin.api';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';

export function AdminPatientsPage() {
  const { data, error, loading } = useAsync(() => adminApi.listPatients(), []);

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
        <h1>Patients</h1>
        <p>All registered patients. Open a row to see diet and food plans.</p>
      </header>

      <Alert variant="error" message={error ?? ''} />

      <Card title={`Patient list (${data?.length ?? 0})`}>
        {!data?.length ? (
          <p className="muted">No patients yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Age</th>
                  <th>BMI</th>
                  <th>Disease</th>
                  <th>Plan</th>
                  <th>Diet</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.name}</td>
                    <td>{patient.username ?? '—'}</td>
                    <td>{patient.age ?? '—'}</td>
                    <td>{patient.bmi ?? '—'}</td>
                    <td className="cell-clamp">{patient.disease ?? '—'}</td>
                    <td>
                      <span className={patient.has_health_plan ? 'pill pill-ok' : 'pill'}>
                        {patient.has_health_plan ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={patient.has_dietary_plan ? 'pill pill-ok' : 'pill'}>
                        {patient.has_dietary_plan ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="text-link"
                        to={`/admin/patients/${patient.patient_id}`}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
