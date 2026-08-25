/**
 * Backend calls for authentication. Used only by AuthContext.
 * POST /auth/login/ returns JWT access + refresh tokens.
 * POST /auth/register/ creates the Django user (and Patient), then the context logs in.
 */
import { apiClient } from '@/api/client';
import type { AuthTokens, LoginCredentials, RegisterPayload } from '@/types/auth.types';

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
};
