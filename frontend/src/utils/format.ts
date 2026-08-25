/**
 * Display helpers. formatApiError extracts a message from thrown errors.
 * parseErrorBody turns Django JSON (`error` / `detail`) into a single string —
 * used by api/client.ts. formatDate renders ISO timestamps on plan/diet pages.
 */
import type { ApiErrorBody } from '@/types/api.types';

export function formatApiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function parseErrorBody(body: ApiErrorBody): string {
  if (body.error) return body.error;
  if (typeof body.detail === 'string') return body.detail;
  if (body.detail && typeof body.detail === 'object') {
    return Object.values(body.detail).flat().join(', ');
  }
  return 'Request failed';
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
