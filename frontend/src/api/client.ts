/**
 * Shared fetch wrapper used by every API module (auth, health, prescription).
 *
 * Builds requests to `VITE_API_BASE_URL` (or `/api`). When `auth: true`, attaches
 * `Authorization: Bearer <access token>`. On 401 it tries `/auth/refresh/` with the
 * refresh token and retries once; if that fails it clears storage and sends the
 * user to /login. Non-OK responses become ApiError with a parsed Django message.
 */
import { ApiError, type ApiErrorBody } from '@/types/api.types';
import { tokenStorage } from '@/utils/storage';
import { parseErrorBody } from '@/utils/format';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

function handleUnauthorized() {
  tokenStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    tokenStorage.clear();
    return null;
  }

  const data = (await response.json()) as { access: string };
  const username = tokenStorage.getUsername() ?? '';
  tokenStorage.setTokens(data.access, refresh, username);
  return data.access;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const execute = (accessToken?: string) => {
    const headersForRequest = new Headers(requestHeaders);
    if (accessToken) {
      headersForRequest.set('Authorization', `Bearer ${accessToken}`);
    }

    return fetch(`${API_BASE}${endpoint}`, {
      ...rest,
      headers: headersForRequest,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await execute(auth ? tokenStorage.getAccessToken() || undefined : undefined);

  if (response.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await execute(newToken);
    } else {
      handleUnauthorized();
      throw new ApiError('Session expired. Please sign in again.', 401);
    }
  }

  if (!response.ok) {
    let errorBody: ApiErrorBody = {};
    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      // non-JSON error response
    }
    throw new ApiError(parseErrorBody(errorBody), response.status, errorBody);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
