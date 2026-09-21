/**
 * /cabins — patients pick dates, apply for a free cabin, and download invoices.
 */
import { FormEvent, useMemo, useState } from 'react';
import { cabinApi } from '@/api/cabin.api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';
import type { CabinApplicationStatus } from '@/types/cabin.types';
import { formatApiError } from '@/utils/format';

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultStart() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

function defaultEnd() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return toIsoDate(date);
}

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

export function CabinsPage() {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [range, setRange] = useState({ start: defaultStart(), end: defaultEnd() });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const cabinsState = useAsync(
    () => cabinApi.listCabins(range.start, range.end),
    [range.start, range.end],
  );
  const applicationsState = useAsync(() => cabinApi.listApplications(), []);

  const cabins = cabinsState.data ?? [];
  const applications = applicationsState.data ?? [];
  const nights = useMemo(() => {
    const start = new Date(`${range.start}T00:00:00`);
    const end = new Date(`${range.end}T00:00:00`);
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }, [range.end, range.start]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setRange({ start: startDate, end: endDate });
  };

  const handleApply = async (cabinId: number) => {
    setError('');
    setSuccess('');
    setApplyingId(cabinId);
    try {
      await cabinApi.apply(cabinId, range.start, range.end);
      setSuccess('Request sent. Staff will approve or reject it.');
      await Promise.all([cabinsState.refetch(), applicationsState.refetch()]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setApplyingId(null);
    }
  };

  const handleCancel = async (applicationId: number) => {
    setError('');
    setSuccess('');
    setBusyId(applicationId);
    try {
      await cabinApi.cancel(applicationId);
      await applicationsState.refetch();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleInvoice = async (applicationId: number, invoiceNumber: string) => {
    setError('');
    setBusyId(applicationId);
    try {
      const blob = await cabinApi.downloadInvoice(applicationId);
      downloadBlob(blob, `${invoiceNumber}.pdf`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  if (applicationsState.loading && cabinsState.loading) {
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
        <p>Apply for a free cabin. You are allotted the room after staff approve the request.</p>
      </header>

      <Alert variant="error" message={error || cabinsState.error || applicationsState.error || ''} />
      <Alert variant="success" message={success} />

      <div className="stack">
        <Card title="Stay dates">
          <form className="stack" onSubmit={handleSearch}>
            <div className="grid-2">
              <Input
                label="Check-in"
                name="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="Check-out"
                name="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Check availability</Button>
          </form>
        </Card>

        <Card
          title="Cabins"
          subtitle={
            nights > 0
              ? `${range.start} → ${range.end} · ${nights} night${nights === 1 ? '' : 's'}`
              : 'Choose a check-out date after check-in.'
          }
        >
          {cabinsState.loading ? (
            <Spinner />
          ) : !cabins.length ? (
            <p className="muted">No active cabins yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cabin</th>
                    <th>Type</th>
                    <th>Nightly rate</th>
                    <th>Status</th>
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
                        <span className={cabin.available ? 'pill pill-ok' : 'pill pill-danger'}>
                          {cabin.available ? 'Free' : 'Taken'}
                        </span>
                      </td>
                      <td>
                        <Button
                          type="button"
                          disabled={!cabin.available || nights < 1}
                          loading={applyingId === cabin.cabin_id}
                          onClick={() => handleApply(cabin.cabin_id)}
                        >
                          Apply
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={`My requests (${applications.length})`}>
          {!applications.length ? (
            <p className="muted">You have not applied for a cabin yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cabin</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.application_id}>
                      <td>
                        {application.cabin.number} · {application.cabin.cabin_type}
                      </td>
                      <td>
                        {application.start_date} → {application.end_date}
                      </td>
                      <td>
                        <span className={statusClass(application.status)}>{application.status}</span>
                        {application.reject_reason ? (
                          <p className="muted">{application.reject_reason}</p>
                        ) : null}
                      </td>
                      <td>
                        {application.status === 'pending' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            loading={busyId === application.application_id}
                            onClick={() => handleCancel(application.application_id)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                        {application.status === 'approved' && application.invoice ? (
                          <Button
                            type="button"
                            variant="secondary"
                            loading={busyId === application.application_id}
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
        </Card>
      </div>
    </div>
  );
}
