/**
 * Shared HTTP helpers for the frontend API layer (auth, health, admin, prescription).
 */
import { ApiError, type ApiErrorBody } from '@/types/api.types';
import { tokenStorage } from '@/utils/storage';
import { parseErrorBody } from '@/utils/format';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

/** Clears the session and redirects to /login when refresh fails. */
function handleUnauthorized() {
  tokenStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * Exchanges the stored refresh token for a new access token.
 * Returns the new access token, or null if refresh is missing/invalid.
 */
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
  tokenStorage.setTokens(data.access, refresh, username, tokenStorage.getIsStaff());
  return data.access;
}

/**
 * Sends an HTTP request to the Django API and returns the JSON body as type `T`.
 *
 * @param endpoint - Path under the API base (e.g. `/auth/login/`, `/health/admin/patients/`).
 * @param options - Fetch options plus:
 *   - `body`: object (JSON) or `FormData`; objects are stringified automatically.
 *   - `auth`: when `true`, sends `Authorization: Bearer <access token>` from localStorage.
 *
 * Behavior:
 * 1. Builds the full URL from `VITE_API_BASE_URL` (default `/api`) + `endpoint`.
 * 2. If `auth` is true and the server returns 401, tries one refresh via `/auth/refresh/`
 *    and retries the request with the new access token.
 * 3. If refresh fails, clears tokens, redirects to `/login`, and throws `ApiError`.
 * 4. For any other non-OK status, parses the Django error body and throws `ApiError`.
 * 5. Returns `undefined` for HTTP 204; otherwise parses and returns JSON as `T`.
 *
 * Used by `auth.api`, `health.api`, `admin.api`, and `prescription.api`.
 */
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
