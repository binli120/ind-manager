// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

export const parsePositiveNumber = (
  value: string | undefined,
  fallback: number,
) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

