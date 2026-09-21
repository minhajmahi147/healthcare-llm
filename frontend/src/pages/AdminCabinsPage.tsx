/**
 * /admin/cabins — staff manage rooms and approve or reject patient requests.
 */
import { FormEvent, useState } from 'react';
import { adminApi } from '@/api/admin.api';
import { cabinApi } from '@/api/cabin.api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';
import type { CabinApplicationStatus } from '@/types/cabin.types';
import { formatApiError } from '@/utils/format';

function statusClass(status: CabinApplicationStatus) {
  if (status === 'approved') return 'pill pill-ok';
  if (status === 'pending') return 'pill pill-pending';
  if (status === 'rejected') return 'pill pill-danger';
  return 'pill';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminCabinsPage() {
  const cabinsState = useAsync(() => adminApi.listCabins(), []);
  const [statusFilter, setStatusFilter] = useState('pending');
  const applicationsState = useAsync(
    () => adminApi.listCabinApplications(statusFilter || undefined),
    [statusFilter],
  );
  const [number, setNumber] = useState('');
  const [cabinType, setCabinType] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const cabins = cabinsState.data ?? [];
  const applications = applicationsState.data ?? [];

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await adminApi.createCabin({
        number,
        cabin_type: cabinType,
        nightly_rate: nightlyRate,
      });
      setNumber('');
      setCabinType('');
      setNightlyRate('');
      setSuccess('Cabin added.');
      await cabinsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cabinId: number, isActive: boolean) => {
    setError('');
    setBusyId(`cabin-${cabinId}`);
    try {
      await adminApi.updateCabin(cabinId, { is_active: !isActive });
      await cabinsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (applicationId: number) => {
    setError('');
    setSuccess('');
    setBusyId(`approve-${applicationId}`);
    try {
      const application = await adminApi.approveCabinApplication(applicationId);
      setSuccess(
        `Allotted cabin ${application.cabin.number}. Invoice ${application.invoice?.invoice_number} is ready.`,
      );
      await applicationsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    const reason = window.prompt('Reject reason (optional)') ?? '';
    setError('');
    setSuccess('');
    setBusyId(`reject-${applicationId}`);
    try {
      await adminApi.rejectCabinApplication(applicationId, reason);
      await applicationsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleInvoice = async (applicationId: number, invoiceNumber: string) => {
    setError('');
    setBusyId(`invoice-${applicationId}`);
    try {
      const blob = await cabinApi.downloadInvoice(applicationId);
      downloadBlob(blob, `${invoiceNumber}.pdf`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  if (cabinsState.loading && applicationsState.loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Cabins</h1>
        <p>Add rooms, then approve patient requests. Approval allots the cabin and creates an invoice PDF.</p>
      </header>

      <Alert variant="error" message={error || cabinsState.error || applicationsState.error || ''} />
      <Alert variant="success" message={success} />

      <div className="stack">
        <Card title="Add cabin">
          <form className="stack" onSubmit={handleCreate}>
            <div className="grid-2">
              <Input
                label="Number"
                name="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
              <Input
                label="Type"
                name="cabin_type"
                value={cabinType}
                onChange={(e) => setCabinType(e.target.value)}
                placeholder="Deluxe"
                required
              />
            </div>
            <Input
              label="Nightly rate"
              name="nightly_rate"
              type="number"
              min="1"
              step="0.01"
              value={nightlyRate}
              onChange={(e) => setNightlyRate(e.target.value)}
              required
            />
            <Button type="submit" loading={saving}>
              Add cabin
            </Button>
          </form>
        </Card>

        <Card title={`Rooms (${cabins.length})`}>
          {!cabins.length ? (
            <p className="muted">No cabins yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Type</th>
                    <th>Rate</th>
                    <th>Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cabins.map((cabin) => (
                    <tr key={cabin.cabin_id}>
                      <td>{cabin.number}</td>
                      <td>{cabin.cabin_type}</td>
                      <td>{cabin.nightly_rate}</td>
                      <td>
                        <span className={cabin.is_active ? 'pill pill-ok' : 'pill'}>
                          {cabin.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          loading={busyId === `cabin-${cabin.cabin_id}`}
                          onClick={() => handleToggle(cabin.cabin_id, cabin.is_active)}
                        >
                          {cabin.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Requests">
          <div className="stack">
          <label className="field" htmlFor="request-status">
            <span className="field-label">Status</span>
            <select
              id="request-status"
              className="field-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="">All</option>
            </select>
          </label>

          {applicationsState.loading ? (
            <Spinner />
          ) : !applications.length ? (
            <p className="muted">No requests in this filter.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Cabin</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.application_id}>
                      <td>{application.patient.name}</td>
                      <td>
                        {application.cabin.number} · {application.cabin.cabin_type}
                      </td>
                      <td>
                        {application.start_date} → {application.end_date} ({application.nights}n)
                      </td>
                      <td>
                        <span className={statusClass(application.status)}>{application.status}</span>
                      </td>
                      <td>
                        {application.status === 'pending' ? (
                          <div className="assignment-row">
                            <Button
                              type="button"
                              loading={busyId === `approve-${application.application_id}`}
                              onClick={() => handleApprove(application.application_id)}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              loading={busyId === `reject-${application.application_id}`}
                              onClick={() => handleReject(application.application_id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : null}
                        {application.invoice ? (
                          <Button
                            type="button"
                            variant="secondary"
                            loading={busyId === `invoice-${application.application_id}`}
                            onClick={() =>
                              handleInvoice(
                                application.application_id,
                                application.invoice!.invoice_number,
                              )
                            }
                          >
                            Invoice
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </Card>
      </div>
    </div>
  );
}
