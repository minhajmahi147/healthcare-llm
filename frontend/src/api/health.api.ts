/**
 * Backend calls for the health feature. All requests send the JWT (`auth: true`).
 * getProfile / saveProfile hit /health/profile/ (GET vs POST).
 * getPlan and getDietaryRecommendation load the latest AI-generated plan and meals.
 * Used by HealthProfilePage, HealthPlanPage, DietaryPage, and HealthProfileForm.
 */
import { apiClient } from '@/api/client';
import type {
  DietaryRecommendation,
  HealthPlan,
  HealthProfile,
  HealthProfilePayload,
} from '@/types/health.types';

export const healthApi = {
  getProfile: () =>
    apiClient<HealthProfile>('/health/profile/', { auth: true }),

  saveProfile: (payload: HealthProfilePayload) =>
    apiClient<HealthProfile>('/health/profile/', {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  getPlan: () =>
    apiClient<HealthPlan>('/health/plan/', { auth: true }),

  getDietaryRecommendation: () =>
    apiClient<DietaryRecommendation>('/health/dietary-recommendation/', { auth: true }),
};
