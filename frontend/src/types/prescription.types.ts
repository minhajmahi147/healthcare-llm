/**
 * TypeScript shapes for parsed prescriptions from the Django OCR endpoint.
 * PrescriptionDetail is the full result (patient, precautions, medicines, summary).
 * PrescriptionMedicine is one drug row. PrescriptionUploadResult is the same
 * object returned immediately after upload.
 */
export interface PrescriptionMedicine {
  med_id: number;
  name: string;
  dosage: string;
  instruction: string;
  number_of_pills_in_day: number;
  part_of_day: string;
  expire_date: string | null;
}

export interface PrescriptionPatient {
  patient_id: number;
  name: string;
  email: string | null;
}

export interface PrescriptionSummary {
  total_medicines: number;
  total_pills_per_day: number;
}

export interface PrescriptionDetail {
  message?: string;
  prescription_id: number;
  patient: PrescriptionPatient;
  precautions: string;
  medicines: PrescriptionMedicine[];
  summary: PrescriptionSummary;
}

export type PrescriptionUploadResult = PrescriptionDetail;
