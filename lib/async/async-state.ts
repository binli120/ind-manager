// Author: Bin Lee
// Email: binlee120@gmail.com

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<TData> = {
  status: AsyncStatus;
  data: TData;
  error: string | null;
};

export const createIdleAsyncState = <TData>(data: TData): AsyncState<TData> => ({
  status: 'idle',
  data,
  error: null,
});

export const toLoadingAsyncState = <TData>(state: AsyncState<TData>): AsyncState<TData> => ({
  ...state,
  status: 'loading',
  error: null,
});

export const toSuccessAsyncState = <TData>(data: TData): AsyncState<TData> => ({
  status: 'success',
  data,
  error: null,
});

export const toErrorAsyncState = <TData>(
  state: AsyncState<TData>,
  error: string,
): AsyncState<TData> => ({
  ...state,
  status: 'error',
  error,
});

export const toAsyncErrorMessage = (
  error: unknown,
  fallback = 'An unexpected error occurred',
): string => {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    const message = (error as { message: string }).message.trim();
    if (message) {
      return message;
    }
  }

  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
};
