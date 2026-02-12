// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import {
  createIdleAsyncState,
  toAsyncErrorMessage,
  toErrorAsyncState,
  toLoadingAsyncState,
  toSuccessAsyncState,
} from '@/lib/async/async-state';

describe('lib/async/async-state', () => {
  it('creates and transitions async state', () => {
    const idle = createIdleAsyncState<string[]>([]);
    expect(idle).toEqual({
      status: 'idle',
      data: [],
      error: null,
    });

    const loading = toLoadingAsyncState(idle);
    expect(loading.status).toBe('loading');
    expect(loading.error).toBeNull();

    const success = toSuccessAsyncState(['a']);
    expect(success).toEqual({
      status: 'success',
      data: ['a'],
      error: null,
    });

    const failed = toErrorAsyncState(success, 'boom');
    expect(failed).toEqual({
      status: 'error',
      data: ['a'],
      error: 'boom',
    });
  });

  it('normalizes unknown errors to user-safe messages', () => {
    expect(toAsyncErrorMessage(new Error('from-error'))).toBe('from-error');
    expect(toAsyncErrorMessage({ message: 'from-object' })).toBe('from-object');
    expect(toAsyncErrorMessage('from-string')).toBe('from-string');
    expect(toAsyncErrorMessage({})).toBe('An unexpected error occurred');
  });
});
