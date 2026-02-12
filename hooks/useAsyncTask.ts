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
  const taskRef = useRef(task);
  const mapErrorRef = useRef(mapError);
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    mapErrorRef.current = mapError;
  }, [mapError]);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  const run = useCallback(
    async (...args: TArgs): Promise<AsyncTaskRunResult<TData>> => {
      const requestId = ++requestIdRef.current;
      setState((previousState) => toLoadingAsyncState(previousState));

      try {
        const data = await taskRef.current(...args);
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return { data, error: null };
        }

        setState(toSuccessAsyncState(data));
        return { data, error: null };
      } catch (error: unknown) {
        const errorMessage = mapErrorRef.current
          ? mapErrorRef.current(error)
          : toAsyncErrorMessage(error);

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return { data: null, error: errorMessage };
        }

        setState((previousState) => toErrorAsyncState(previousState, errorMessage));
        return { data: null, error: errorMessage };
      }
    },
    [],
  );

  const reset = useCallback(
    (...args: [TData?]) => {
      const nextData =
        args.length > 0 ? (args[0] as TData) : initialDataRef.current;
      requestIdRef.current += 1;
      setState(createIdleAsyncState(nextData));
    },
    [],
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
