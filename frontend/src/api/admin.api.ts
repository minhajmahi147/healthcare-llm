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
import type { Cabin, CabinApplication } from '@/types/cabin.types';

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

  listCabins: () =>
    apiClient<Cabin[]>('/cabins/admin/cabins/', { auth: true }),

  createCabin: (payload: {
    number: string;
    cabin_type: string;
    nightly_rate: string;
  }) =>
    apiClient<Cabin>('/cabins/admin/cabins/', {
      method: 'POST',
      auth: true,
      body: payload,
    }),

  updateCabin: (
    cabinId: number,
    payload: Partial<{
      number: string;
      cabin_type: string;
      nightly_rate: string;
      is_active: boolean;
    }>,
  ) =>
    apiClient<Cabin>(`/cabins/admin/cabins/${cabinId}/`, {
      method: 'PATCH',
      auth: true,
      body: payload,
    }),

  listCabinApplications: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient<CabinApplication[]>(`/cabins/admin/applications/${query}`, {
      auth: true,
    });
  },

  approveCabinApplication: (applicationId: number) =>
    apiClient<CabinApplication>(
      `/cabins/admin/applications/${applicationId}/approve/`,
      { method: 'POST', auth: true },
    ),

  rejectCabinApplication: (applicationId: number, reason?: string) =>
    apiClient<CabinApplication>(
      `/cabins/admin/applications/${applicationId}/reject/`,
      { method: 'POST', auth: true, body: { reason: reason || '' } },
    ),
};
