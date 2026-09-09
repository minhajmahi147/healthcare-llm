/**
 * Backend calls for authentication.
 */
import { apiClient } from '@/api/client';
import type {
  AdminRegisterPayload,
  AuthTokens,
  LoginCredentials,
  RegisterPayload,
} from '@/types/auth.types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient<AuthTokens>('/auth/login/', {
      method: 'POST',
      body: credentials,
    }),

  register: (payload: RegisterPayload) =>
    apiClient<{ message: string }>('/auth/register/', {
      method: 'POST',
      body: payload,
    }),

  registerAdmin: (payload: AdminRegisterPayload) =>
    apiClient<{ message: string; username: string; is_staff: boolean }>(
      '/auth/admin/register/',
      {
        method: 'POST',
        body: payload,
        auth: true,
      },
    ),
};
