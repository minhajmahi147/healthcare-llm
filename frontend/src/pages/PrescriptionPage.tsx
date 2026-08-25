/**
 * /prescription page. Intro copy plus PrescriptionUpload so the user can
 * send a PDF to Django for OCR. After upload they are sent to the result page.
 */
import { PrescriptionUpload } from '@/features/prescription/PrescriptionUpload';

export function PrescriptionPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Prescription</h1>
        <p>Upload a PDF prescription to extract patient and medicine details automatically.</p>
      </header>
      <PrescriptionUpload />
    </div>
  );
}
