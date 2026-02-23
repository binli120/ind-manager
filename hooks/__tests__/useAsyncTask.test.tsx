// Author: Bin Lee
// Email: binlee120@gmail.com

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAsyncTask } from '@/hooks/useAsyncTask';

function AsyncTaskHarness({
  task,
}: {
  task: (value: number) => Promise<number>;
}) {
  const asyncTask = useAsyncTask(task, 0);

  return (
    <div>
      <div data-testid='status'>{asyncTask.status}</div>
      <div data-testid='data'>{String(asyncTask.data)}</div>
      <div data-testid='error'>{asyncTask.error ?? ''}</div>
      <button onClick={() => void asyncTask.run(1)}>run</button>
      <button onClick={() => asyncTask.setError('manual-error')}>set-error</button>
      <button onClick={() => asyncTask.reset(5)}>reset</button>
    </div>
  );
}

describe('hooks/useAsyncTask', () => {
  it('tracks successful task state', async () => {
    const task = jest.fn(async (value: number) => value + 1);
    const user = userEvent.setup();

    render(<AsyncTaskHarness task={task} />);

    expect(screen.getByTestId('status').textContent).toBe('idle');
    expect(screen.getByTestId('data').textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: 'run' }));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });
    expect(screen.getByTestId('data').textContent).toBe('2');
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(task).toHaveBeenCalledWith(1);
  });

  it('tracks failed task state', async () => {
    const task = jest.fn(async () => {
      throw new Error('boom');
    });
    const user = userEvent.setup();

    render(<AsyncTaskHarness task={task} />);
    await user.click(screen.getByRole('button', { name: 'run' }));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).toBe('boom');
  });

  it('supports manual error and reset transitions', async () => {
    const task = jest.fn(async (value: number) => value);
    const user = userEvent.setup();

    render(<AsyncTaskHarness task={task} />);

    await user.click(screen.getByRole('button', { name: 'set-error' }));
    expect(screen.getByTestId('status').textContent).toBe('error');
    expect(screen.getByTestId('error').textContent).toBe('manual-error');

    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('status').textContent).toBe('idle');
    expect(screen.getByTestId('data').textContent).toBe('5');
    expect(screen.getByTestId('error').textContent).toBe('');
  });
});
