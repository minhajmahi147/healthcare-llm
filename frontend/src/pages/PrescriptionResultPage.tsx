/**
 * /prescription/result/:id page. Reads the id from the URL, fetches that
 * prescription with prescriptionApi.getById(), and renders PrescriptionResult.
 * Shows a spinner while loading and a link back to upload another PDF.
 */
import { useParams, Link } from 'react-router-dom';
import { prescriptionApi } from '@/api/prescription.api';
import { PrescriptionResult } from '@/features/prescription/PrescriptionResult';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';

export function PrescriptionResultPage() {
  const { id } = useParams();
  const prescriptionId = Number(id);

  const { data, error, loading } = useAsync(
    () => prescriptionApi.getById(prescriptionId),
    [prescriptionId],
  );

  if (!prescriptionId || Number.isNaN(prescriptionId)) {
    return (
      <div className="page">
        <Alert variant="error" message="Invalid prescription ID." />
        <Link to="/prescription"><Button variant="secondary">Upload another</Button></Link>
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

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Prescription results</h1>
          <p>Review required medications, daily intake, and precautions.</p>
        </div>
        <Link to="/prescription">
          <Button variant="secondary">Upload another</Button>
        </Link>
      </header>

      <Alert variant="error" message={error ?? ''} />
      {data ? <PrescriptionResult data={data} /> : null}
    </div>
  );
}
