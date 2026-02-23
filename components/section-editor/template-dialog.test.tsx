// Author: Bin Lee
// Email: binlee120@gmail.com

import { flattenRows, normalizeRow } from './template-dialog'
import type { TemplateRow } from '@/types/section'

describe('Template dialog parsing', () => {
  const sample = {
    section: '2.4',
    entries: [
      {
        section: '2.4.1',
        subsection: '2.4.1',
        element_number: '2.4.1-a',
        section_header: 'Overview',
        subsection_header: 'Overview',
        content: 'Block A',
        raw: { foo: 'bar' },
      },
      {
        section: '2.4.1',
        subsection: '2.4.1',
        element_number: '2.4.1-a',
        section_header: 'Overview',
        subsection_header: 'Overview',
        content: 'Block A duplicate',
        raw: 'raw-string',
      },
      {
        section: '2.4.2',
        subsection: '2.4.2',
        element_number: '2.4.2-b',
        section_header: 'Pharmacology',
        subsection_header: 'Pharmacology',
        content: 'Block B',
      },
    ],
  }

  it('produces unique ids and populates raw text', () => {
    const rows = flattenRows(sample)
    const ids = new Set(rows.map((r) => r.id))
    expect(ids.size).toBe(rows.length)

    const firstRaw = rows[0].raw as string
    expect(firstRaw).toContain('"foo"')
    expect(firstRaw).toContain('"bar"')
  })

  it('uses element_number as id when provided', () => {
    const row = normalizeRow({ element_number: '2.4.1-x' }) as TemplateRow
    expect(row.id).toBe('2.4.1-x')
  })
})
