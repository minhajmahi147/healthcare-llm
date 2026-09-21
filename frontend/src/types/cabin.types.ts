/**
 * Types for cabin listing, applications, and invoices.
 */

export type CabinApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface Cabin {
  cabin_id: number;
  number: string;
  cabin_type: string;
  nightly_rate: string;
  is_active: boolean;
  available: boolean;
}

export interface CabinInvoice {
  invoice_number: string;
  nights: number;
  nightly_rate: string;
  total: string;
  issued_at: string;
}

export interface CabinApplication {
  application_id: number;
  status: CabinApplicationStatus;
  start_date: string;
  end_date: string;
  nights: number;
  reject_reason: string;
  created_at: string;
  cabin: {
    cabin_id: number;
    number: string;
    cabin_type: string;
    nightly_rate: string;
  };
  patient: {
    patient_id: number;
    name: string;
  };
  invoice: CabinInvoice | null;
}
