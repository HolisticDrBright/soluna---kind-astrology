import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  reloading: boolean;
  error: string | null;
  refetch: () => void;
  setData: (next: T | null) => void;
}

/**
 * Runs an async fetcher that follows the api.ts convention
 * (`{ data, error }`) and exposes loading / empty / error / retry state so
 * commercial screens have consistent states instead of mock placeholders.
 *
 * The fetcher is kept in a ref so callers can pass an inline arrow without
 * causing re-fetch loops; re-fetching is driven by `deps`.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<{ data: T | null; error: string | null }>,
  deps: unknown[] = [],
  options?: { enabled?: boolean },
): AsyncState<T> {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Track the latest run so a slow, superseded response can't overwrite a newer
  // one, and so we never setState after the component has unmounted.
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (isRefetch: boolean) => {
    const runId = ++runIdRef.current;
    const isStale = () => !mountedRef.current || runId !== runIdRef.current;
    if (isRefetch) setReloading(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current();
      if (isStale()) return;
      if (res.error) setError(res.error);
      else setData(res.data);
    } catch (e) {
      if (isStale()) return;
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      if (!isStale()) {
        if (isRefetch) setReloading(false);
        else setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  const refetch = useCallback(() => {
    void run(true);
  }, [run]);

  return { data, loading, reloading, error, refetch, setData };
}
