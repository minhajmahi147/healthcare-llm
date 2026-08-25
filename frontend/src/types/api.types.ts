/**
 * Shared error types for HTTP failures.
 * ApiError is thrown by api/client.ts and includes status + optional details.
 * ApiErrorBody matches Django REST error JSON (`error` or `detail` as a string
 * or field-error map). parseErrorBody in utils/format.ts turns that into UI text.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiErrorBody {
  error?: string;
  detail?: string | Record<string, string[]>;
}
