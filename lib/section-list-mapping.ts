// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import sectionListMappingRaw from "@/config/section_List_mapping.json"

export type SectionTemplateType = "folder" | "file"

export interface SectionTemplateEntry {
  id: string
  value: string
  text: string
  depth: number
  type: SectionTemplateType
  desc?: string
}

const toTemplateType = (value: unknown): SectionTemplateType =>
  String(value || "").toLowerCase() === "file" ? "file" : "folder"

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim()

const stripPrefixValue = (text: string, value: string) => {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(new RegExp(`^\\s*${escapedValue}\\s*(?:[—-]|:)\\s*`, "i"), "").trim()
}

const normalizeTitleKey = (value: string) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\.(pdf|doc|docx)$/i, "")

const entriesFromJson = (sectionListMappingRaw as unknown[]).flatMap((item, idx) => {
  if (!item || typeof item !== "object") return []
  const obj = item as Record<string, unknown>
  const value = typeof obj.value === "string" ? obj.value.trim() : ""
  const text = typeof obj.text === "string" ? obj.text.trim() : ""
  if (!value || !text) return []
  return [
    {
      id: typeof obj.id === "string" && obj.id.trim() ? obj.id.trim() : `entry-${idx}`,
      value,
      text,
      depth: Number.isFinite(obj.depth) ? Number(obj.depth) : 0,
      type: toTemplateType(obj.type),
      desc: typeof obj.desc === "string" && obj.desc.trim() ? obj.desc.trim() : undefined,
    } satisfies SectionTemplateEntry,
  ]
})

export const SECTION_TEMPLATE_ENTRIES: SectionTemplateEntry[] = entriesFromJson

const byValue = new Map<string, SectionTemplateEntry>()
const byTitle = new Map<string, SectionTemplateEntry>()
const byValuePrefix = [...SECTION_TEMPLATE_ENTRIES].sort((a, b) => b.value.length - a.value.length)

SECTION_TEMPLATE_ENTRIES.forEach((entry) => {
  byValue.set(entry.value.toLowerCase(), entry)

  const withPrefix = normalizeTitleKey(entry.text)
  if (!byTitle.has(withPrefix)) byTitle.set(withPrefix, entry)

  const withoutPrefix = normalizeTitleKey(stripPrefixValue(entry.text, entry.value))
  if (withoutPrefix && !byTitle.has(withoutPrefix)) byTitle.set(withoutPrefix, entry)
})

export const getSectionTemplateEntries = () => SECTION_TEMPLATE_ENTRIES

export const getSectionListPayload = () => ({
  count: SECTION_TEMPLATE_ENTRIES.length,
  sections: SECTION_TEMPLATE_ENTRIES,
})

export const findSectionTemplateEntryByValue = (value?: string | null) => {
  if (!value) return null
  return byValue.get(value.trim().toLowerCase()) ?? null
}

const hasBoundary = (source: string, value: string) => {
  if (!source.startsWith(value)) return false
  const boundary = source.charAt(value.length)
  return !boundary || /[\s—\-_:./()[\]]/.test(boundary)
}

export const findSectionTemplateEntryForName = (name?: string | null) => {
  if (!name) return null
  const trimmed = normalizeWhitespace(name)
  if (!trimmed) return null

  const byExactValue = findSectionTemplateEntryByValue(trimmed)
  if (byExactValue) return byExactValue

  const lower = trimmed.toLowerCase()
  const prefixed = byValuePrefix.find((entry) => hasBoundary(lower, entry.value.toLowerCase()))
  if (prefixed) return prefixed

  const key = normalizeTitleKey(trimmed)
  const byExactTitle = byTitle.get(key)
  if (byExactTitle) return byExactTitle

  const noPrefixKey = normalizeTitleKey(
    trimmed.replace(/^\s*\d+(?:\.[a-z0-9]+)*(?:[a-z])?\s*(?:[—-]|:)?\s*/i, ""),
  )
  if (noPrefixKey) {
    const byNoPrefixTitle = byTitle.get(noPrefixKey)
    if (byNoPrefixTitle) return byNoPrefixTitle
  }

  return null
}

export const toTemplateDisplayTitle = (entry: SectionTemplateEntry) =>
  stripPrefixValue(entry.text, entry.value) || entry.text
