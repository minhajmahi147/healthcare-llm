/**
 * Generic data-loading hook used by pages (profile, plan, diet, prescription).
 *
 * Runs the given async function when the component mounts (and when deps change).
 * Exposes `{ data, error, status, loading, refetch }`. `status` is the HTTP code
 * from ApiError so pages can treat 404 as an empty state instead of a hard failure.
 */
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/types/api.types';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  status: number | null;
  loading: boolean;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    status: null,
    loading: true,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, status: null }));
    try {
      const data = await asyncFn();
      setState({ data, error: null, status: null, loading: false });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      const status = err instanceof ApiError ? err.status : null;
      setState({ data: null, error: message, status, loading: false });
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void execute();
  }, [execute]);

  return { ...state, refetch: execute };
}
