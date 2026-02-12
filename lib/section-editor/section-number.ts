// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

export const extractSectionNumber = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)*)(?:[^\d.]|$)/);
  return match ? match[1] : null;
};

