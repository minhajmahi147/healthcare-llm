/**
 * PDF file picker for prescriptions. On submit it POSTs the file through
 * prescriptionApi.upload() to Django OCR. If parsing succeeds it navigates to
 * /prescription/result/:id so PrescriptionResultPage can show medicines.
 */
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionApi } from '@/api/prescription.api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatApiError } from '@/utils/format';

export function PrescriptionUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a PDF prescription file.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await prescriptionApi.upload(file);
      navigate(`/prescription/result/${response.prescription_id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Upload prescription" subtitle="Upload a PDF prescription for AI-powered extraction">
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Prescription PDF</span>
          <input
            className="field-input"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <Alert variant="error" message={error} />
        <Button type="submit" loading={loading}>Process prescription</Button>
      </form>
    </Card>
  );
}
