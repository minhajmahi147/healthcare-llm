/**
 * Read-only view of a parsed prescription.
 * Shows patient name/email, precautions, a MedicineCard for each drug, and a
 * pill-count summary. Used by PrescriptionResultPage after a successful upload
 * or when opening a saved prescription by id.
 */
import type { PrescriptionDetail } from '@/types/prescription.types';
import { MedicineCard } from '@/features/prescription/MedicineCard';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface PrescriptionResultProps {
  data: PrescriptionDetail;
}

export function PrescriptionResult({ data }: PrescriptionResultProps) {
  const hasMedicines = data.medicines.length > 0;

  return (
    <div className="stack">
      <div className="summary-grid">
        <Card title="Patient" subtitle={`Prescription #${data.prescription_id}`}>
          <p className="summary-value">{data.patient.name}</p>
          {data.patient.email ? <p className="summary-meta">{data.patient.email}</p> : null}
        </Card>

        <Card title="Medicines prescribed" subtitle="Total medications in this prescription">
          <p className="summary-value">{data.summary.total_medicines}</p>
        </Card>

        <Card title="Daily intake" subtitle="Total pills to take per day">
          <p className="summary-value">{data.summary.total_pills_per_day}</p>
        </Card>
      </div>

      <Card title="General precautions" subtitle="Important notes from your prescription">
        <p className="content-block">{data.precautions || 'No general precautions were noted.'}</p>
      </Card>

      {hasMedicines ? (
        <section className="stack">
          <header className="section-header">
            <h2>Medication schedule</h2>
            <p>Each medicine below shows dosage, daily count, timing, and specific instructions.</p>
          </header>

          <div className="grid-cards">
            {data.medicines.map((medicine) => (
              <MedicineCard key={medicine.med_id} medicine={medicine} />
            ))}
          </div>
        </section>
      ) : (
        <Alert variant="info" message="No medicines were found in this prescription." />
      )}
    </div>
  );
}
