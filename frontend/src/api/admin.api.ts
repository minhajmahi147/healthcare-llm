/**
 * Staff-only health admin APIs.
 * GET /health/admin/patients/ — list
 * GET /health/admin/patients/:id/ — detail with diet and food plan
 */
import { apiClient } from '@/api/client';
import type { AdminPatientDetail, AdminPatientSummary } from '@/types/admin.types';

export const adminApi = {
  listPatients: () =>
    apiClient<AdminPatientSummary[]>('/health/admin/patients/', { auth: true }),

  getPatient: (patientId: number) =>
    apiClient<AdminPatientDetail>(`/health/admin/patients/${patientId}/`, {
      auth: true,
    }),
};
