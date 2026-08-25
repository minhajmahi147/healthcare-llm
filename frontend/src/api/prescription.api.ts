/**
 * Backend calls for prescription OCR. upload() sends a PDF as multipart FormData
 * to /upload-prescription/. getById() loads the saved parse result from
 * /prescription/:id/. Used by PrescriptionUpload and PrescriptionResultPage.
 */
import { apiClient } from '@/api/client';
import type { PrescriptionDetail, PrescriptionUploadResult } from '@/types/prescription.types';

export const prescriptionApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient<PrescriptionUploadResult>('/upload-prescription/', {
      method: 'POST',
      body: formData,
    });
  },

  getById: (prescriptionId: number) =>
    apiClient<PrescriptionDetail>(`/prescription/${prescriptionId}/`),
};
