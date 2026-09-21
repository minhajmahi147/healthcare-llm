/**
 * Patient cabin APIs: list rooms, apply, see own requests, download invoice.
 */
import { apiClient } from '@/api/client';
import type { Cabin, CabinApplication } from '@/types/cabin.types';

export const cabinApi = {
  listCabins: (startDate?: string, endDate?: string) => {
    const query =
      startDate && endDate
        ? `?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
        : '';
    return apiClient<Cabin[]>(`/cabins/${query}`, { auth: true });
  },

  listApplications: () =>
    apiClient<CabinApplication[]>('/cabins/applications/', { auth: true }),

  apply: (cabinId: number, startDate: string, endDate: string) =>
    apiClient<CabinApplication>('/cabins/applications/', {
      method: 'POST',
      auth: true,
      body: { cabin_id: cabinId, start_date: startDate, end_date: endDate },
    }),

  cancel: (applicationId: number) =>
    apiClient<CabinApplication>(`/cabins/applications/${applicationId}/cancel/`, {
      method: 'POST',
      auth: true,
    }),

  downloadInvoice: (applicationId: number) =>
    apiClient<Blob>(`/cabins/applications/${applicationId}/invoice/`, {
      auth: true,
      blob: true,
    }),
};
