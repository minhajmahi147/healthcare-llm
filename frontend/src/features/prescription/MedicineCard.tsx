/**
 * One medicine from an OCR'd prescription: name, dosage, times per day,
 * part of day, instructions, and optional expiry. Rendered in a list inside
 * PrescriptionResult.
 */
import type { PrescriptionMedicine } from '@/types/prescription.types';
import { Card } from '@/components/ui/Card';

interface MedicineCardProps {
  medicine: PrescriptionMedicine;
}

function formatPartOfDay(value: string): string {
  return value
    .split(/[/,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(', ');
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  return (
    <Card
      title={medicine.name}
      subtitle={medicine.expire_date ? `Expires ${medicine.expire_date}` : 'Expiry date not available'}
    >
      <dl className="detail-list">
        <div className="detail-item">
          <dt>Dosage</dt>
          <dd>{medicine.dosage}</dd>
        </div>
        <div className="detail-item">
          <dt>Pills per day</dt>
          <dd className="pill-count">{medicine.number_of_pills_in_day}</dd>
        </div>
        <div className="detail-item">
          <dt>When to take</dt>
          <dd>{formatPartOfDay(medicine.part_of_day)}</dd>
        </div>
        <div className="detail-item detail-item-full">
          <dt>Instructions & precautions</dt>
          <dd>{medicine.instruction}</dd>
        </div>
      </dl>
    </Card>
  );
}
