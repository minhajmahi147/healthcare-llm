/**
 * Staff-only health admin APIs.
 * GET /health/admin/patients/ — list
 * GET /health/admin/patients/:id/ — detail with diet and food plan
 * GET /admin/doctors/ — list doctors and assigned patients
 * POST /admin/doctors/:id/patients/ — assign a patient
 * DELETE /admin/doctors/:id/patients/:patientId/ — unassign a patient
 */
import { apiClient } from '@/api/client';
import type {
  AdminDoctor,
  AdminPatientDetail,
  AdminPatientSummary,
} from '@/types/admin.types';

export const adminApi = {
  listPatients: () =>
    apiClient<AdminPatientSummary[]>('/health/admin/patients/', { auth: true }),

  getPatient: (patientId: number) =>
    apiClient<AdminPatientDetail>(`/health/admin/patients/${patientId}/`, {
      auth: true,
    }),

  listDoctors: () =>
    apiClient<AdminDoctor[]>('/admin/doctors/', { auth: true }),

  assignPatient: (doctorId: number, patientId: number) =>
    apiClient<AdminDoctor>(`/admin/doctors/${doctorId}/patients/`, {
      method: 'POST',
      auth: true,
      body: { patient_id: patientId },
    }),

  unassignPatient: (doctorId: number, patientId: number) =>
    apiClient<AdminDoctor>(
      `/admin/doctors/${doctorId}/patients/${patientId}/`,
      { method: 'DELETE', auth: true },
    ),
};
