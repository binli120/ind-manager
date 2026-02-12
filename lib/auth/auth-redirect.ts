// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

export const resolveAuthEmailRedirectUrl = (fallbackOrigin: string) =>
  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || fallbackOrigin;

