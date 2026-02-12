// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { createBrowserClient } from '@/lib/supabase';
import { fetchSampleUsers } from '@/lib/examples/supabase-example-service';

jest.mock('@/lib/supabase', () => ({
  createBrowserClient: jest.fn(),
}));

describe('lib/examples/supabase-example-service', () => {
  beforeEach(() => {
    (createBrowserClient as jest.Mock).mockReset();
  });

  it('returns users from supabase query', async () => {
    const limit = jest.fn().mockResolvedValue({ data: [{ id: 'u1' }], error: null });
    const select = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ select }));

    (createBrowserClient as jest.Mock).mockReturnValue({ from });

    const result = await fetchSampleUsers();

    expect(from).toHaveBeenCalledWith('users');
    expect(select).toHaveBeenCalledWith('*');
    expect(limit).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('throws when supabase returns an error', async () => {
    const dbError = new Error('query failed');
    const limit = jest.fn().mockResolvedValue({ data: null, error: dbError });
    const select = jest.fn(() => ({ limit }));
    const from = jest.fn(() => ({ select }));

    (createBrowserClient as jest.Mock).mockReturnValue({ from });

    await expect(fetchSampleUsers()).rejects.toThrow('query failed');
  });
});
