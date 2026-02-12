// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  createIdleAsyncState,
  toAsyncErrorMessage,
  toErrorAsyncState,
  toLoadingAsyncState,
  toSuccessAsyncState,
  type AsyncState,
} from '@/lib/async/async-state';
import { useCallback, useEffect, useRef, useState } from 'react';

type UseAsyncTaskOptions = {
  mapError?: (error: unknown) => string;
};

type AsyncTaskRunResult<TData> = {
  data: TData | null;
  error: string | null;
};

export function useAsyncTask<TArgs extends unknown[], TData>(
  task: (...args: TArgs) => Promise<TData>,
  initialData: TData,
  options: UseAsyncTaskOptions = {},
) {
  const { mapError } = options;
  const [state, setState] = useState<AsyncState<TData>>(() =>
    createIdleAsyncState(initialData),
  );

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<AsyncTaskRunResult<TData>> => {
      const requestId = ++requestIdRef.current;
      setState((previousState) => toLoadingAsyncState(previousState));

      try {
        const data = await task(...args);
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return { data, error: null };
        }

        setState(toSuccessAsyncState(data));
        return { data, error: null };
      } catch (error: unknown) {
        const errorMessage = mapError
          ? mapError(error)
          : toAsyncErrorMessage(error);

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return { data: null, error: errorMessage };
        }

        setState((previousState) => toErrorAsyncState(previousState, errorMessage));
        return { data: null, error: errorMessage };
      }
    },
    [mapError, task],
  );

  const reset = useCallback(
    (nextData: TData = initialData) => {
      requestIdRef.current += 1;
      setState(createIdleAsyncState(nextData));
    },
    [initialData],
  );

  const setData = useCallback(
    (updater: TData | ((previousData: TData) => TData)) => {
      setState((previousState) => {
        const nextData =
          typeof updater === 'function'
            ? (updater as (previousData: TData) => TData)(previousState.data)
            : updater;

        return {
          ...previousState,
          data: nextData,
        };
      });
    },
    [],
  );

  const setError = useCallback((error: string | null) => {
    setState((previousState) => ({
      ...previousState,
      status: error ? 'error' : previousState.status === 'error' ? 'idle' : previousState.status,
      error,
    }));
  }, []);

  return {
    ...state,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    run,
    reset,
    setData,
    setError,
  };
}
