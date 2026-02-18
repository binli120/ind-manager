// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TiptapEditor } from "@/components/section-editor/tiptap-editor"
import { TemplateDialog, flattenRows } from "@/components/section-editor/template-dialog"
import { MaterialsDialog } from "@/components/section-editor/materials-dialog"
import { MyMaterialsDialog } from "@/components/section-editor/my-materials-dialog"
import { TableInsertDialog } from "@/components/section-editor/table-insert-dialog"
import { DeleteSubsectionDialog } from "@/components/section-editor/delete-subsection-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Save, CheckCircle2, Trash2, Loader2 } from "lucide-react"
import type { Section, SubsectionContent } from "@/types/section"
import type { ImageData, MaterialItem, TableData, TopicData } from "@/components/section-editor/my-materials-dialog"
import { AddSectionDialog } from "@/components/section-editor/add-section-dialog"
import { extractSectionNumber } from "@/lib/section-editor/section-number"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"
import { fetchSectionList } from "@/lib/store/slices/sectionListSlice"

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const wrapHtmlContent = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed)
  return looksLikeHtml ? trimmed : `<p>${escapeHtml(trimmed)}</p>`
}

const normalizeTemplateText = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()

const buildTemplatePlaceholder = (payload: unknown) => {
  const rows = flattenRows(payload)
  if (!rows.length) return ""

  const unique = new Set<string>()
  const lines: string[] = []

  rows.forEach((row) => {
    const line = normalizeTemplateText(row.content || row.subsectionHeader || row.sectionHeader || "")
    if (!line || unique.has(line)) return
    unique.add(line)
    lines.push(line)
  })

  return lines.slice(0, 3).join("\n")
}

const templatePlaceholderCache = new Map<string, string>()

const buildTableHtml = (table: TableData) => {
  const title = table.title ? `<p><strong>${escapeHtml(table.title)}</strong></p>` : ""
  if (table.html) return `${title}${table.html}`
  const headers = table.headers ?? []
  const rows = table.rows ?? []
  if (!headers.length && !rows.length) return title
  const thead = headers.length
    ? `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`
    : ""
  const tbody = rows.length
    ? `<tbody>${rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody>`
    : ""
  return `${title}<table>${thead}${tbody}</table>`
}

const buildImageHtml = (image: ImageData) => {
  if (!image.url) return ""
  const captionParts = [image.title, image.caption].filter(Boolean) as string[]
  const caption = captionParts.length ? `<p><em>${escapeHtml(captionParts.join(" — "))}</em></p>` : ""
  const alt = escapeHtml(image.title || "Image")
  return `<p><img src="${escapeHtml(image.url)}" alt="${alt}" /></p>${caption}`
}

const buildTopicHtml = (topic: TopicData) => {
  const title = topic.title ? `<h3>${escapeHtml(topic.title)}</h3>` : ""
  const text = topic.content ? wrapHtmlContent(topic.content) : ""
  const images =
    topic.images && topic.images.length
      ? `<div><h4>Images</h4>${topic.images.map(buildImageHtml).join("")}</div>`
      : ""
  const tables =
    topic.tables && topic.tables.length
      ? `<div><h4>Tables</h4>${topic.tables.map(buildTableHtml).join("")}</div>`
      : ""
  const blocks = [title, text, images, tables].filter(Boolean).join("")
  return blocks ? `<section>${blocks}</section>` : ""
}

const isTopicMaterial = (material: MaterialItem): material is MaterialItem & { data: TopicData } =>
  material.type === "topic" && !!material.data && typeof material.data === "object"

interface SectionEditorProps {
  section: Section
  selectedSubsection: SubsectionContent | null
  onAddSubsection: (subsectionNumber: string, header: string) => void
  onDeleteSubsection: (subsectionId: string) => void
  onSelectSubsection: (subsection: SubsectionContent) => void
}

function SubsectionEditor({
  subsection,
  fallbackSectionNumber,
  onSave,
  onApprove,
  onDelete,
  index,
  total,
}: {
  subsection: SubsectionContent
  fallbackSectionNumber?: string
  onSave: (id: string) => void
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  index: number
  total: number
}) {
  const effectiveSectionNumber =
    extractSectionNumber(subsection.subsectionNumber) ||
    extractSectionNumber(subsection.title) ||
    extractSectionNumber(fallbackSectionNumber) ||
    subsection.subsectionNumber
  const [content, setContent] = useState(subsection.content)
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false)
  const [showMyMaterialsDialog, setShowMyMaterialsDialog] = useState(false)
  const [materialsCount, setMaterialsCount] = useState(0)
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiText, setAiText] = useState<string | null>(null)
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [templateResolving] = useState(false)
  const [templateResolveError, setTemplateResolveError] = useState<string | null>(null)
  const [resolvedSection, setResolvedSection] = useState(effectiveSectionNumber)
  const [showTableInsert, setShowTableInsert] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateDisabled, setTemplateDisabled] = useState(false)
  const [templatePlaceholder, setTemplatePlaceholder] = useState("")
  const userId = useAppSelector((s) => s.auth.user?.id)
  const sectionList = useAppSelector((s) => s.sectionList.data)

  useEffect(() => {
    setResolvedSection(effectiveSectionNumber)
  }, [effectiveSectionNumber])

  useEffect(() => {
    // Re-enable when user logs in so we can retry
    if (userId) setTemplateDisabled(false)
  }, [userId])

  useEffect(() => {
    const sectionParam = effectiveSectionNumber
    const isContentEmpty = normalizeTemplateText(subsection.content || "").length === 0
    if (!isContentEmpty || !userId || !sectionParam) {
      setTemplatePlaceholder("")
      return
    }

    const cacheKey = `${userId}:${sectionParam}`
    const cached = templatePlaceholderCache.get(cacheKey)
    if (cached !== undefined) {
      setTemplatePlaceholder(cached)
      return
    }

    let cancelled = false
    const loadTemplatePlaceholder = async () => {
      try {
        const response = await requestPdfAnalysisApi<
          Record<string, unknown>,
          undefined,
          { section: string }
        >({
          path: "/ncd/template",
          method: "GET",
          query: { section: sectionParam },
          headers: { "user-id": userId },
          userIdHeader: userId,
          allowRedirects: false,
          suppressErrorLog: true,
        })
        const placeholder = buildTemplatePlaceholder(response)
        templatePlaceholderCache.set(cacheKey, placeholder)
        if (!cancelled) {
          setTemplatePlaceholder(placeholder)
        }
      } catch {
        templatePlaceholderCache.set(cacheKey, "")
        if (!cancelled) {
          setTemplatePlaceholder("")
        }
      }
    }
    void loadTemplatePlaceholder()

    return () => {
      cancelled = true
    }
  }, [effectiveSectionNumber, subsection.content, userId])

  useEffect(() => {
    const retryTemplate = async () => {
      if (!templateDisabled || !userId) return
      try {
        const response = await requestPdfAnalysisApi<
          Record<string, unknown>,
          undefined,
          { section: string }
        >({
          path: "/ncd/template",
          method: "GET",
          query: { section: effectiveSectionNumber },
          userIdHeader: userId,
        })
        const rows = Array.isArray(response)
          ? response
          : Object.values(response || {}).flatMap((v) => (Array.isArray(v) ? v : []))
        if (rows.length > 0) setTemplateDisabled(false)
      } catch {
        // keep disabled
      }
    }
    void retryTemplate()
  }, [templateDisabled, userId, effectiveSectionNumber])

  const [isAnimating, setIsAnimating] = useState(subsection.isUserAdded)

  useEffect(() => {
    if (subsection.isUserAdded && isAnimating) {
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [subsection.isUserAdded, isAnimating])

  const handleTableInsert = (rows: number, cols: number) => {
    console.log(`[v0] Inserting table: ${rows}x${cols} for section ${subsection.subsectionNumber}`)
  }

  const getStatusBadge = () => {
    if (subsection.status === "accepted") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Accepted</Badge>
      )
    }
    return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">Draft</Badge>
  }

  const getEditorBackground = () => {
    const colors = [
      "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20",
      "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20",
      "bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20",
      "bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20",
      "bg-gradient-to-br from-cyan-50/50 to-sky-50/50 dark:from-cyan-950/20 dark:to-sky-950/20",
    ]
    return colors[index % colors.length]
  }

  const isSection265 = subsection.subsectionNumber === "2.6.5"

  const handleAiGenerate = async () => {
    const sectionNumber = "2.4.1"
    setShowAiDialog(true)
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch("/api/ncd/assets/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: sectionNumber,
          tenant_id: "c38daae8-07a8-4da4-9a68-9a9955b09f70",
          project_id: "2b44ecab-45c8-4105-b4ae-e9b7080bb4d6",
          bucket: "doc-repository-dev",
          user_prompt: "",
          user_comment: "",
          previous_summary_id: "",
          refresh_template: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Request failed (${res.status})`)
      }
      const text = typeof data?.summary_text === "string" ? data.summary_text : JSON.stringify(data, null, 2)
      setAiText(text)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate summary"
      setAiError(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiInsert = () => {
    if (!aiText) return
    const insertContent = `<p>${aiText.replace(/\n/g, "<br>")}</p>`
    const selection = document.getSelection()
    const editorRoot = document.querySelector(".ProseMirror")
    const hasFocus =
      selection &&
      selection.rangeCount > 0 &&
      selection.anchorNode &&
      editorRoot instanceof HTMLElement &&
      editorRoot.contains(selection.anchorNode as Node)

    const newContent = hasFocus ? content + insertContent : insertContent + content

    console.info("[materials] applying insert (ai)", {
      hasFocus,
      insertLength: insertContent.length,
      originalLength: content.length,
      newLength: newContent.length,
      preview: newContent.slice(0, 200),
    })

    setContent(newContent)
    setShowAiDialog(false)
    setAiText(null)
  }

  const handleInsertMaterials = (selected: MaterialItem[]) => {
    const topicsHtml = selected
      .filter(isTopicMaterial)
      .map((item) => buildTopicHtml(item.data))
      .filter((html) => html.length > 0)

    if (!topicsHtml.length) return

    const insertContent = topicsHtml.join("<hr />")
    const selection = document.getSelection()
    const editorRoot = document.querySelector(".ProseMirror")
    const hasFocus =
      selection &&
      selection.rangeCount > 0 &&
      selection.anchorNode &&
      editorRoot instanceof HTMLElement &&
      editorRoot.contains(selection.anchorNode as Node)

    const newContent = hasFocus ? content + insertContent : insertContent + content

    console.info("[materials] applying insert (topics)", {
      hasFocus,
      insertLength: insertContent.length,
      originalLength: content.length,
      newLength: newContent.length,
      topics: topicsHtml.length,
    })

    setContent(newContent)
  }

  const resolveSectionFromList = (payload: unknown): string | null => {
    if (!payload || typeof payload !== "object") return null
    const sections = Array.isArray((payload as Record<string, unknown>).sections)
      ? ((payload as Record<string, unknown>).sections as unknown[])
      : []
    const title = subsection.title?.trim().toLowerCase()

    for (const entry of sections) {
      if (!entry || typeof entry !== "object") continue
      const obj = entry as Record<string, unknown>
      const text = typeof obj.text === "string" ? obj.text.trim() : ""
      const value = typeof obj.value === "string" ? obj.value.trim() : ""
      const label = text.includes("—") ? text.split("—").pop()?.trim() : text
      if (!title || !label) continue
      if (label.toLowerCase() === title || text.toLowerCase() === title || text.endsWith(subsection.title || "")) {
        return value || extractSectionNumber(text) || null
      }
    }
    return null
  }

  const handleOpenTemplate = async () => {
    setTemplateResolveError(null)
    const direct = effectiveSectionNumber
    if (direct) {
      setResolvedSection(direct)
      setShowTemplate(true)
      return
    }

    const cached = sectionList ? resolveSectionFromList(sectionList) : null
    if (cached) {
      setResolvedSection(cached)
      setShowTemplate(true)
      return
    }

    setTemplateResolveError("Could not resolve section number from section list.")
  }

  return (
    <div
      id={`section-${subsection.subsectionNumber}`}
      className={`border-2 border-border rounded-lg ${getEditorBackground()} mb-8 shadow-sm ${
        isAnimating ? "animate-in slide-in-from-bottom-4 fade-in duration-500" : ""
      }`}
    >
      <div className="border-b-2 border-border bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs px-2 py-1">
              {index + 1} of {total}
            </Badge>
            <span className="text-base font-bold text-foreground">{effectiveSectionNumber}</span>
            {subsection.isCategory && subsection.title && (
              <span className="text-sm text-muted-foreground">{subsection.title}</span>
            )}
            {subsection.isUserAdded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete this element"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2" data-tour="status">
            {getStatusBadge()}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenTemplate}
            className="text-xs"
            disabled={!userId || templateDisabled || templateResolving}
            title={
              !userId
                ? "Login required to view template"
                : templateDisabled
                  ? "Template unavailable"
                  : templateResolving
                    ? "Resolving section…"
                    : undefined
            }
            data-tour="detailed-template"
          >
            {templateResolving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1.5" />
            )}
            View & Edit Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowMaterialsDialog(true)} className="text-xs">
            Materials ({materialsCount})
          </Button>
          {isSection265 && (
            <Button variant="outline" size="sm" onClick={() => setShowTableInsert(true)} className="text-xs">
              Select Table
            </Button>
          )}
        </div>
        {templateResolveError && (
          <p className="text-xs text-destructive mt-2">{templateResolveError}</p>
        )}
      </div>

      <div className="px-6 py-4" data-tour="editor-toolbar">
        <TiptapEditor
          content={content}
          onChange={setContent}
          materialsCount={materialsCount}
          onOpenMaterials={() => setShowMyMaterialsDialog(true)}
          onAiGenerate={handleAiGenerate}
          aiGenerating={aiLoading}
          sectionNumber={effectiveSectionNumber}
          placeholder={templatePlaceholder}
        />
      </div>

      <div className="border-t border-border px-6 py-4 bg-card/80 backdrop-blur-sm" data-tour="save-approve">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Section {effectiveSectionNumber}</div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => onSave(subsection.id)}>
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onApprove(subsection.id)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept
            </Button>
          </div>
        </div>
      </div>

      <TemplateDialog
        open={showTemplate}
        onOpenChange={setShowTemplate}
        section={{
          id: subsection.id,
          number: resolvedSection || effectiveSectionNumber,
          title: subsection.title,
        }}
        onUnavailable={() => setTemplateDisabled(true)}
        onAvailable={() => setTemplateDisabled(false)}
      />

      <MaterialsDialog
        open={showMaterialsDialog}
        onOpenChange={setShowMaterialsDialog}
        keyword=""
        subsectionId={subsection.subsectionNumber}
        subsectionTitle={subsection.title}
        sectionNumber="4"
        materials={materials}
        onMaterialsChange={(items) => {
          setMaterials(items)
          setMaterialsCount(items.length)
        }}
        onMaterialsCountChange={setMaterialsCount}
      />

      <MyMaterialsDialog
        open={showMyMaterialsDialog}
        onOpenChange={setShowMyMaterialsDialog}
        materials={materials}
        onInsertMaterials={handleInsertMaterials}
      />

      {isSection265 && (
        <TableInsertDialog
          open={showTableInsert}
          onOpenChange={setShowTableInsert}
          onInsert={handleTableInsert}
        />
      )}

      <DeleteSubsectionDialog
        open={showDeleteDialog}
        onOpenChangeAction={setShowDeleteDialog}
        subsectionNumber={effectiveSectionNumber}
        onConfirm={() => onDelete(subsection.id)}
      />

      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>AI Draft Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating summary…
              </div>
            )}
            {aiError && <div className="text-sm text-destructive">{aiError}</div>}
            {aiText && (
              <div className="border rounded-md p-3 bg-muted/40 max-h-96 overflow-auto text-sm whitespace-pre-wrap">
                {aiText}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowAiDialog(false)} disabled={aiLoading}>
              Cancel
            </Button>
            <Button onClick={handleAiInsert} disabled={aiLoading || !aiText}>
              Insert into editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SectionEditor({
  section,
  selectedSubsection,
  onAddSubsection,
  onDeleteSubsection,
  onSelectSubsection,
}: SectionEditorProps) {
  const dispatch = useAppDispatch()
  const userId = useAppSelector((s) => s.auth.user?.id)
  const sectionList = useAppSelector((s) => s.sectionList.data)
  const sectionListLoading = useAppSelector((s) => s.sectionList.loading)
  const sectionListError = useAppSelector((s) => s.sectionList.error)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    if (!userId) return
    if (sectionList || sectionListLoading || sectionListError) return
    void dispatch(fetchSectionList({ userId }))
  }, [dispatch, userId, sectionList, sectionListLoading, sectionListError])

  const findParentSubsection = (subsection: SubsectionContent | null): SubsectionContent | null => {
    if (!subsection) return null

    const checkNested = (subs: SubsectionContent[]): SubsectionContent | null => {
      for (const sub of subs) {
        if (sub.subsections) {
          if (sub.subsections.some((s) => s.id === subsection.id)) {
            return sub
          }
          const found = checkNested(sub.subsections)
          if (found) return found
        }
      }
      return null
    }

    return checkNested(section.subsections || [])
  }

  const parentSubsection = findParentSubsection(selectedSubsection)
  const isViewingCategorySubsection = selectedSubsection?.isCategory === true

  let mainHeader = `${section.number} ${section.title}`
  let subHeader: string | null = null

  if (selectedSubsection) {
    if (parentSubsection) {
      mainHeader = `${parentSubsection.subsectionNumber} ${parentSubsection.title}`
      subHeader = `${selectedSubsection.subsectionNumber} ${selectedSubsection.title}`
    } else if (selectedSubsection.isCategory) {
      mainHeader = `${selectedSubsection.subsectionNumber} ${selectedSubsection.title}`
    } else {
      subHeader = `${selectedSubsection.subsectionNumber} ${selectedSubsection.title}`
    }
  }

  const subsectionsToShow = selectedSubsection
    ? isViewingCategorySubsection
      ? selectedSubsection.subsections || []
      : parentSubsection
        ? parentSubsection.subsections || []
        : [selectedSubsection]
    : section.subsections || []

  const baseSectionNumber = selectedSubsection
    ? isViewingCategorySubsection
      ? selectedSubsection.subsectionNumber
      : parentSubsection
        ? parentSubsection.subsectionNumber
        : section.number
    : section.number

  const inlineEditorSubsections = subsectionsToShow.filter(
    (subsection) => !subsection.isCategory && !subsection.fullPath,
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
      <div className="w-full max-w-[calc(100%-20px)] mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-tour="section-title">
                {mainHeader}
              </h1>
              {subHeader && (
                <div className="mt-3 pt-3 border-t border-border">
                  <h2 className="text-xl font-semibold text-foreground">{subHeader}</h2>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Regulatory AI Assistant</p>
            </div>
          </div>
        </div>

        {subsectionsToShow.length > 0 && (
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border mb-6 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3" data-tour="jump-navigation">
                <span className="text-sm font-medium text-muted-foreground">Jump to section:</span>
                <div className="flex gap-2 flex-wrap">
                  {subsectionsToShow.map((sub) => (
                    <Button
                      key={sub.id}
                      variant={selectedSubsection?.id === sub.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => onSelectSubsection(sub)}
                      className="h-7 px-3 text-xs"
                    >
                      {sub.subsectionNumber}
                    </Button>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                Add new element
              </Button>
            </div>
          </div>
        )}

        {subsectionsToShow.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No content available for this section.</p>
            <Button variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2">
              <FileText className="h-4 w-4" />
              Add first element
            </Button>
          </div>
        ) : inlineEditorSubsections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              This folder contains nested folders/files only. Select an item from Jump to section.
            </p>
          </div>
        ) : (
          inlineEditorSubsections.map((subsection, index) => (
            <div key={subsection.id}>
              <SubsectionEditor
                subsection={subsection}
                fallbackSectionNumber={baseSectionNumber}
                onSave={() => {}}
                onApprove={() => {}}
                onDelete={onDeleteSubsection}
                index={index}
                total={inlineEditorSubsections.length}
              />
            </div>
          ))
        )}

        <AddSectionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          sectionNumber={baseSectionNumber}
          existingSubsections={subsectionsToShow}
          onAddSection={onAddSubsection}
        />
      </div>
    </div>
  )
}
