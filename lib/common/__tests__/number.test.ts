// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { parsePositiveNumber } from '@/lib/common/number';

describe('parsePositiveNumber', () => {
  it('returns parsed positive values', () => {
    expect(parsePositiveNumber('45', 30)).toBe(45);
    expect(parsePositiveNumber('0.5', 1)).toBe(0.5);
  });

  it('falls back for invalid values', () => {
    expect(parsePositiveNumber(undefined, 30)).toBe(30);
    expect(parsePositiveNumber('0', 30)).toBe(30);
    expect(parsePositiveNumber('-1', 30)).toBe(30);
    expect(parsePositiveNumber('abc', 30)).toBe(30);
  });
});

