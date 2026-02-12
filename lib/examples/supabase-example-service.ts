// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { createBrowserClient } from '@/lib/supabase';

export async function fetchSampleUsers(): Promise<unknown[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('users').select('*').limit(10);

  if (error) {
    throw error;
  }

  return data ?? [];
}
