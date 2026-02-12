// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { extractSectionNumber } from '@/lib/section-editor/section-number';

describe('extractSectionNumber', () => {
  it('extracts numeric section identifiers', () => {
    expect(extractSectionNumber('4.2 Nonclinical')).toBe('4.2');
    expect(extractSectionNumber('3.1.4 - Drug Substance')).toBe('3.1.4');
    expect(extractSectionNumber('12')).toBe('12');
  });

  it('returns null when section number is not present', () => {
    expect(extractSectionNumber(undefined)).toBeNull();
    expect(extractSectionNumber(null)).toBeNull();
    expect(extractSectionNumber('Module Four')).toBeNull();
  });
});

