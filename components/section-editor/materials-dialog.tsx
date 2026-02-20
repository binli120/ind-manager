// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"
import {
  MATERIALS_ASSET_SECTION_FALLBACK,
  MATERIALS_DEFAULTS,
} from "@/lib/section-editor/constants"
import {
  AlertCircle,
  FileText,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Search,
  Table as TableIcon,
  Plus,
  FolderKanban,
} from "lucide-react"
import type { MaterialItem, TableData, ImageData, TopicData } from "./my-materials-dialog"
import { sanitizeHtml } from "@/lib/utils/sanitize-html"

interface AssetsSectionImage {
  id?: string
  title?: string
  caption?: string
  url?: string
}

interface AssetsSectionTable {
  id?: string
  title?: string
  headers?: string[]
  rows?: string[][]
  html?: string
}

interface AssetsSectionTopic {
  id?: string
  title?: string
  content?: string
  images?: AssetsSectionImage[]
  tables?: AssetsSectionTable[]
}

interface AssetsSectionDocument {
  id?: string
  name?: string
  section?: string
  topics?: AssetsSectionTopic[]
}

interface AssetsSectionResponse {
  section?: string
  documents?: AssetsSectionDocument[]
  metadata?: Record<string, unknown> | null
  source?: string
}

interface MaterialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: string
  subsectionId?: string
  subsectionTitle?: string
  onMaterialsCountChange?: (count: number) => void
  materials: MaterialItem[]
  onMaterialsChange: (items: MaterialItem[]) => void
  tenantId?: string
  projectId?: string
  sectionNumber?: string
  bucket?: string
  limit?: number
}

const toPlainText = (html: string) =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const parseHtmlTable = (html?: string): TableData | undefined => {
  if (!html) return undefined
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const headers = Array.from(doc.querySelectorAll("table thead th")).map((th) => th.textContent?.trim() || "")
    const rows = Array.from(doc.querySelectorAll("table tbody tr")).map((tr) =>
      Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() || ""),
    )
    if (!headers.length && !rows.length) return undefined
    return { headers: headers.length ? headers : undefined, rows: rows.length ? rows : undefined }
  } catch {
    return undefined
  }
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined

const resolveImageUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined
  const obj = value as Record<string, unknown>
  const direct =
    asString(obj.url) ||
    asString(obj.download_url) ||
    asString(obj.downloadUrl) ||
    asString(obj.file_url) ||
    asString(obj.fileUrl) ||
    asString(obj.image_url) ||
    asString(obj.imageUrl) ||
    asString(obj.s3_url) ||
    asString(obj.s3Url)
  if (direct) return direct
  const nestedKeys = ["file", "asset", "source", "image", "data"]
  for (const key of nestedKeys) {
    const nested = obj[key]
    if (nested && typeof nested === "object") {
      const nestedObj = nested as Record<string, unknown>
      const nestedUrl =
        asString(nestedObj.url) ||
        asString(nestedObj.download_url) ||
        asString(nestedObj.downloadUrl) ||
        asString(nestedObj.file_url) ||
        asString(nestedObj.fileUrl) ||
        asString(nestedObj.image_url) ||
        asString(nestedObj.imageUrl) ||
        asString(nestedObj.s3_url) ||
        asString(nestedObj.s3Url)
      if (nestedUrl) return nestedUrl
    }
  }
  return undefined
}

const resolveTableHtml = (value: unknown): string | undefined => {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined
  const obj = value as Record<string, unknown>
  return (
    asString(obj.html) ||
    asString(obj.table) ||
    asString(obj.html_table) ||
    asString(obj.htmlTable) ||
    asString(obj.html_table_html) ||
    asString(obj.htmlTableHtml)
  )
}

const hasTableSignature = (value: unknown): boolean => {
  if (typeof value === "string") {
    const lower = value.toLowerCase()
    return lower.includes("<table") || lower.includes("<tr") || lower.includes("<td")
  }
  if (!value || typeof value !== "object") return false
  const obj = value as Record<string, unknown>
  const type = asString(obj.type) ?? asString(obj.asset_type)
  if (type && type.toLowerCase().includes("table")) return true
  return (
    Boolean(resolveTableHtml(obj)) ||
    Array.isArray(obj.headers) ||
    Array.isArray(obj.rows)
  )
}

const hasImageSignature = (value: unknown): boolean => {
  if (typeof value === "string") {
    const lower = value.toLowerCase()
    return /\.(png|jpe?g|gif|bmp|webp|svg)(\?.*)?$/.test(lower)
  }
  if (!value || typeof value !== "object") return false
  const obj = value as Record<string, unknown>
  const type = asString(obj.type) ?? asString(obj.asset_type)
  if (type && (type.toLowerCase().includes("image") || type.toLowerCase().includes("figure"))) return true
  return Boolean(resolveImageUrl(obj))
}

const splitAssets = (assets: unknown[]) => {
  const imageAssets: unknown[] = []
  const tableAssets: unknown[] = []
  for (const asset of assets) {
    if (hasTableSignature(asset)) {
      tableAssets.push(asset)
      continue
    }
    if (hasImageSignature(asset)) {
      imageAssets.push(asset)
    }
  }
  return { imageAssets, tableAssets }
}

const normalizeDocuments = (
  docs: AssetsSectionDocument[],
  fallbackSection: string,
): AssetsSectionDocument[] =>
  docs.map((doc, docIdx) => {
    const topics = Array.isArray(doc.topics) ? doc.topics : []
    return {
      id: doc.id ?? `doc-${docIdx}`,
      name:
        doc.name ??
        (doc as Record<string, string>)?.document_name ??
        (doc as Record<string, string>)?.title ??
        `Document ${docIdx + 1}`,
      section: doc.section ?? fallbackSection,
      topics: topics.map((topic, topicIdx) => {
        const topicObj = topic as Record<string, unknown>
        const imagesRaw = Array.isArray(topic.images) ? topic.images : []
        const assetsObj =
          topicObj.assets && typeof topicObj.assets === "object" && !Array.isArray(topicObj.assets)
            ? (topicObj.assets as Record<string, unknown>)
            : null
        const assetsImagesRaw = Array.isArray(assetsObj?.images) ? assetsObj?.images ?? [] : []
        const assetsTablesRaw = Array.isArray(assetsObj?.tables) ? assetsObj?.tables ?? [] : []
        const assetsRaw = Array.isArray(topicObj.assets) ? topicObj.assets : []
        const tablesRaw = Array.isArray(topic.tables) ? topic.tables : []
        const htmlTablesRaw = Array.isArray(topicObj.html_tables)
          ? topicObj.html_tables
          : Array.isArray(topicObj.htmlTables)
            ? topicObj.htmlTables
            : topicObj.htmlTable || topicObj.html_table
              ? [topicObj.htmlTable ?? topicObj.html_table]
              : []
        const { imageAssets, tableAssets } = splitAssets(assetsRaw)
        const imageInputs = [...imagesRaw, ...assetsImagesRaw, ...imageAssets]
        const tableInputs = [...tablesRaw, ...assetsTablesRaw, ...tableAssets, ...htmlTablesRaw]

        return {
          id: topic.id ?? (topic as Record<string, string>)?.topic_id ?? `topic-${docIdx}-${topicIdx}`,
          title: topic.title ?? (topic as Record<string, string>)?.topic ?? `Topic ${topicIdx + 1}`,
          content:
            topic.content ??
            (topic as Record<string, string>)?.text ??
            (topic as Record<string, string>)?.description ??
            (topic as Record<string, string>)?.summary ??
            "",
          images: imageInputs.map((img, imgIdx) => {
            if (typeof img === "string") {
              return {
                id: `img-${docIdx}-${topicIdx}-${imgIdx}`,
                title: `Image ${imgIdx + 1}`,
                url: img,
              }
            }
            const imgObj = img as Record<string, unknown>
            const url = resolveImageUrl(imgObj) ?? ""
            return {
              id: (img as AssetsSectionImage)?.id ?? `img-${docIdx}-${topicIdx}-${imgIdx}`,
              title: (img as AssetsSectionImage)?.title ?? (img as AssetsSectionImage)?.caption ?? `Image ${imgIdx + 1}`,
              caption: (img as AssetsSectionImage)?.caption,
              url,
            }
          }),
          tables: tableInputs.map((tbl, tblIdx) => {
            if (typeof tbl === "string") {
              return {
                id: `table-${docIdx}-${topicIdx}-${tblIdx}`,
                title: `Table ${tblIdx + 1}`,
                html: tbl,
              }
            }
            const tblObj = tbl as Record<string, unknown>
            const html = resolveTableHtml(tblObj)
            return {
              id: (tbl as AssetsSectionTable)?.id ?? `table-${docIdx}-${topicIdx}-${tblIdx}`,
              title: (tbl as AssetsSectionTable)?.title ?? `Table ${tblIdx + 1}`,
              headers: Array.isArray(tblObj.headers)
                ? tblObj.headers.map((h) => String(h))
                : (tbl as AssetsSectionTable)?.headers,
              rows: Array.isArray(tblObj.rows)
                ? tblObj.rows
                    .filter((row) => Array.isArray(row))
                    .map((row) => (row as unknown[]).map((cell) => String(cell)))
                : (tbl as AssetsSectionTable)?.rows,
              html,
            }
          }),
        }
      }),
    }
  })

export function MaterialsDialog({
  open,
  onOpenChange,
  keyword,
  subsectionId = "2.6.1",
  subsectionTitle = "Nonclinical Overview",
  onMaterialsCountChange,
  materials,
  onMaterialsChange,
  tenantId = MATERIALS_DEFAULTS.tenantId,
  projectId = MATERIALS_DEFAULTS.projectId,
  sectionNumber = MATERIALS_DEFAULTS.sectionNumber,
  bucket = MATERIALS_DEFAULTS.bucket,
  limit = MATERIALS_DEFAULTS.limit,
}: MaterialsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState<AssetsSectionDocument[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0] ?? null,
    [documents, selectedDocumentId],
  )

  useEffect(() => {
    if (open && keyword) setSearchQuery(keyword)
  }, [keyword, open])

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hardcodedSection = MATERIALS_ASSET_SECTION_FALLBACK
      const payload = await requestPdfAnalysisApi<AssetsSectionResponse, undefined, {
        tenant_id: string
        project_id: string
        section: string
        bucket: string
        limit: number
      }>({
        path: "/ncd/assets/section",
        method: "GET",
        query: {
          tenant_id: tenantId,
          project_id: projectId,
          section: hardcodedSection,
          bucket,
          limit,
        },
        allowRedirects: false,
        suppressErrorLog: true,
      })
      const normalized = normalizeDocuments(payload.documents ?? [], payload.section ?? hardcodedSection)
      setDocuments(normalized)
      setSelectedDocumentId((normalized[0]?.id as string | undefined) ?? null)
      setSource(payload.source ?? null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load materials"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [projectId, tenantId, bucket, limit])

  useEffect(() => {
    if (open) {
      void fetchAssets()
    }
  }, [fetchAssets, open])

  useEffect(() => {
    onMaterialsCountChange?.(materials.length)
  }, [materials, onMaterialsCountChange])

  const appendMaterial = (item: MaterialItem) => {
    const exists = item.id ? materials.some((m) => m.id === item.id && m.type === item.type) : false
    const next = exists ? materials : [...materials, item]
    onMaterialsChange(next)
    onMaterialsCountChange?.(next.length)
  }

  const buildTableData = (table: AssetsSectionTable): TableData => {
    const parsed = parseHtmlTable(table.html)
    return {
      id: table.id,
      title: table.title,
      headers: table.headers ?? parsed?.headers,
      rows: table.rows ?? parsed?.rows,
      html: table.html,
    }
  }

  const addEntireTopic = (topic: AssetsSectionTopic, doc: AssetsSectionDocument) => {
    const topicId = topic.id ?? `${doc.id || "doc"}-topic`
    const images = (topic.images ?? []).map((img, idx) => ({
      id: img.id ?? `img-${doc.id || "doc"}-${topicId}-${idx}`,
      title: img.title ?? `Image ${idx + 1}`,
      caption: img.caption,
      url: img.url,
    })) satisfies ImageData[]
    const tables = (topic.tables ?? []).map((tbl) => buildTableData(tbl))
    appendMaterial({
      id: `${doc.id || "doc"}:${topicId}:topic`,
      type: "topic",
      data: {
        id: topicId,
        title: topic.title ?? "Topic",
        content: topic.content ?? "",
        images,
        tables,
        document: {
          id: doc.id,
          name: doc.name,
          section: doc.section,
        },
      } satisfies TopicData,
      timestamp: new Date(),
    })
  }

  const filteredTopics = useMemo(() => {
    if (!selectedDocument) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return selectedDocument.topics ?? []
    return (selectedDocument.topics ?? []).filter((topic) => {
      const plain = toPlainText(topic.content ?? "")
      return (
        topic.title?.toLowerCase().includes(q) ||
        plain.toLowerCase().includes(q) ||
        topic.tables?.some((t) => t.title?.toLowerCase().includes(q)) ||
        topic.images?.some((i) => i.title?.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, selectedDocument])

  const topicCountForDoc = (doc: AssetsSectionDocument) => doc.topics?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-6"
        style={{ width: "96vw", maxWidth: "96vw", height: "90vh", maxHeight: "90vh" }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Materials from Module 4
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Section {sectionNumber || subsectionId}: {subsectionTitle} • Tenant {tenantId.slice(0, 8)} · Project{" "}
                {projectId.slice(0, 8)} {source ? `• Source: ${source}` : ""}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAssets} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Refresh
              </Button>
              <Badge variant="secondary" className="text-xs">
                {materials.length} in My Materials
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-5 h-[calc(90vh-150px)]">
          <div className="w-[320px] min-w-[320px] border border-border/60 rounded-lg bg-card/60 flex flex-col">
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics or documents"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/60">
                {documents.length === 0 && !loading && (
                  <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    No documents available.
                  </div>
                )}
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocumentId(doc.id ?? null)}
                    className={`w-full text-left p-3 transition-colors ${
                      selectedDocument?.id === doc.id ? "bg-accent/60" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Section {doc.section ?? sectionNumber} • {topicCountForDoc(doc)} topics
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 min-w-0 border border-border/60 rounded-lg bg-card/60 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading materials…
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-destructive gap-2 px-6 text-sm">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            ) : !selectedDocument ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a document to view topics.
              </div>
            ) : (
              <div className="h-full flex flex-col min-h-0">
                <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Document</p>
                    <p className="text-base font-semibold">{selectedDocument.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Section {selectedDocument.section ?? sectionNumber} • {selectedDocument.topics?.length ?? 0} topics
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedDocument.topics?.length ?? 0} topics</Badge>
                    <Badge variant="secondary">Module 4</Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-4 p-4">
                    {filteredTopics.length === 0 && (
                      <div className="text-sm text-muted-foreground px-2 py-8 text-center">
                        No topics match “{searchQuery}”.
                      </div>
                    )}
                    {filteredTopics.map((topic) => (
                      <div key={topic.id} className="border border-border/60 rounded-lg bg-background/60 shadow-sm">
                        <div className="flex items-start justify-between gap-3 p-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Topic</p>
                            <h3 className="text-lg font-semibold leading-tight">{topic.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {topic.images?.length ?? 0} images • {topic.tables?.length ?? 0} tables
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => addEntireTopic(topic, selectedDocument)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add Topic
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid md:grid-cols-3 gap-4 p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="h-4 w-4" />
                              Text
                            </div>
                            {topic.content ? (
                              <div className="text-sm text-muted-foreground leading-relaxed line-clamp-8">
                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(topic.content) }} />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No text content</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <ImageIcon className="h-4 w-4" />
                              Images
                            </div>
                            {topic.images && topic.images.length > 0 ? (
                              <div className="space-y-2">
                                {topic.images.map((img) => (
                                  <div key={img.id} className="rounded-md border border-border/60 overflow-hidden">
                                    {img.url ? (
                                      <Image
                                        src={img.url}
                                        alt={img.title || "Selected image"}
                                        width={600}
                                        height={340}
                                        unoptimized
                                        loader={({ src }) => src}
                                        className="w-full h-36 object-cover bg-muted"
                                      />
                                    ) : (
                                      <div className="h-36 flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                        Image unavailable
                                      </div>
                                    )}
                                      <div className="p-2 space-y-1">
                                        <p className="text-xs font-medium line-clamp-1">{img.title}</p>
                                        {img.caption && <p className="text-[11px] text-muted-foreground line-clamp-2">{img.caption}</p>}
                                      </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No images in this topic.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <TableIcon className="h-4 w-4" />
                              Tables
                            </div>
                            {topic.tables && topic.tables.length > 0 ? (
                              <div className="space-y-3">
                                {topic.tables.map((tbl) => {
                                  const tableData = buildTableData(tbl)
                                  return (
                                    <div key={tbl.id} className="rounded-md border border-border/60 p-2 bg-muted/40 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold line-clamp-1">{tbl.title}</p>
                                      </div>
                                      {tableData?.headers && tableData?.rows ? (
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse text-xs">
                                            <thead>
                                              <tr className="border-b border-border/60 bg-muted/70">
                                                {(tableData.headers ?? []).map((h, idx) => (
                                                  <th key={idx} className="text-left px-2 py-1">
                                                    {h}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {(tableData.rows ?? []).slice(0, 3).map((row, rowIdx) => (
                                                <tr key={rowIdx} className="border-b last:border-0 border-border/40">
                                                  {row.map((cell, cellIdx) => (
                                                    <td key={cellIdx} className="px-2 py-1">
                                                      {cell}
                                                    </td>
                                                  ))}
                                                </tr>
                                              ))}
                                              {tableData.rows && tableData.rows.length > 3 && (
                                                <tr>
                                                  <td colSpan={tableData.headers?.length ?? 1} className="px-2 py-1 text-[11px] text-muted-foreground">
                                                    ...and {tableData.rows.length - 3} more rows
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : tbl.html ? (
                                        <div
                                          className="text-[11px] text-muted-foreground leading-relaxed"
                                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(tbl.html) }}
                                        />
                                      ) : (
                                        <p className="text-[11px] text-muted-foreground">Table preview unavailable.</p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No tables provided.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
