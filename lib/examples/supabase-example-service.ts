// Author: Bin Lee
// Email: binlee120@gmail.com

import { createBrowserClient } from '@/lib/supabase';

export async function fetchSampleUsers(): Promise<unknown[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('users').select('*').limit(10);

  if (error) {
    throw error;
  }

  return data ?? [];
}
