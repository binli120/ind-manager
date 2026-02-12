// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

export const SMART_ASSISTANT_TRIGGER_KEYWORDS = [
  'pharmacology',
  'pharmacokinetic',
  'toxicology',
  'nonclinical',
  'kinase inhibitor',
  'efficacy',
  'safety',
  'bioavailability',
] as const;

export const MATERIALS_DEFAULTS = {
  tenantId: 'c38daae8-07a8-4da4-9a68-9a9955b09f70',
  projectId: '2b44ecab-45c8-4105-b4ae-e9b7080bb4d6',
  sectionNumber: '4',
  bucket: 'doc-repository-dev',
  limit: 500,
} as const;

export const MATERIALS_ASSET_SECTION_FALLBACK = '2.4.1';

