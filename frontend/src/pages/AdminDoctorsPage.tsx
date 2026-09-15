/**
 * /admin/doctors — assign patients to doctors.
 */
import { FormEvent, useMemo, useState } from 'react';
import { adminApi } from '@/api/admin.api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';
import { formatApiError } from '@/utils/format';

export function AdminDoctorsPage() {
  const doctorsState = useAsync(() => adminApi.listDoctors(), []);
  const patientsState = useAsync(() => adminApi.listPatients(), []);
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const doctors = doctorsState.data ?? [];
  const patients = patientsState.data ?? [];

  const assignedCounts = useMemo(
    () => doctors.reduce((sum, doctor) => sum + doctor.assigned_patients.length, 0),
    [doctors],
  );

  const handleAssign = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!doctorId || !patientId) {
      setError('Choose a doctor and a patient.');
      return;
    }
    setSaving(true);
    try {
      const doctor = await adminApi.assignPatient(Number(doctorId), Number(patientId));
      setSuccess(`${doctor.name} now has this patient on their list.`);
      setPatientId('');
      await doctorsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (nextDoctorId: number, nextPatientId: number) => {
    setError('');
    setSuccess('');
    const key = `${nextDoctorId}-${nextPatientId}`;
    setRemovingId(key);
    try {
      await adminApi.unassignPatient(nextDoctorId, nextPatientId);
      await doctorsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setRemovingId(null);
    }
  };

  if (doctorsState.loading || patientsState.loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Doctors</h1>
        <p>Assign patients to a doctor. Doctors can only see their own list.</p>
      </header>

      <Alert variant="error" message={error || doctorsState.error || patientsState.error || ''} />
      <Alert variant="success" message={success} />

      <div className="stack">
        <Card title="Assign a patient">
          <form className="stack" onSubmit={handleAssign}>
            <div className="grid-2">
              <label className="field" htmlFor="assign-doctor">
                <span className="field-label">Doctor</span>
                <select
                  id="assign-doctor"
                  className="field-input"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.doctor_id} value={doctor.doctor_id}>
                      {doctor.name} · {doctor.department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="assign-patient">
                <span className="field-label">Patient</span>
                <select
                  id="assign-patient"
                  className="field-input"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.name}
                      {patient.username ? ` · @${patient.username}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button type="submit" loading={saving} disabled={!doctors.length || !patients.length}>
              Assign patient
            </Button>
          </form>
        </Card>

        <Card title={`Assignments (${assignedCounts})`}>
          {!doctors.length ? (
            <p className="muted">No doctors registered yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Assigned patients</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.doctor_id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.department}</td>
                      <td>
                        {!doctor.assigned_patients.length ? (
                          <span className="muted">None</span>
                        ) : (
                          <ul className="assignment-list">
                            {doctor.assigned_patients.map((patient) => (
                              <li key={patient.patient_id} className="assignment-row">
                                <span>
                                  {patient.name}
                                  {patient.email ? ` · ${patient.email}` : ''}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  loading={removingId === `${doctor.doctor_id}-${patient.patient_id}`}
                                  onClick={() => handleUnassign(doctor.doctor_id, patient.patient_id)}
                                >
                                  Unassign
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
