// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TiptapEditor } from "@/components/section-editor/tiptap-editor"
import { TemplateDialog } from "@/components/section-editor/template-dialog"
import { MaterialsDialog } from "@/components/section-editor/materials-dialog"
import { TableInsertDialog } from "@/components/section-editor/table-insert-dialog"
import { DeleteSubsectionDialog } from "@/components/section-editor/delete-subsection-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Save, CheckCircle2, Trash2, Loader2 } from "lucide-react"
import type { Section, SubsectionContent } from "@/types/section"
import type { MaterialItem } from "@/components/section-editor/my-materials-dialog"
import { AddSectionDialog } from "@/components/section-editor/add-section-dialog"
import { useAppSelector } from "@/lib/store"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"

const toSectionNumber = (value?: string | null) => {
  if (!value) return null
  const match = value.match(/^(\d+(?:\.\d+)*)(?:\s|$)/)
  return match ? match[1] : null
}

interface SectionEditorProps {
  section: Section
  selectedSubsection: SubsectionContent | null
  onAddSubsection: (subsectionNumber: string, header: string) => void
  onDeleteSubsection: (subsectionId: string) => void
}

function SubsectionEditor({
  subsection,
  onSave,
  onApprove,
  onDelete,
  index,
  total,
}: {
  subsection: SubsectionContent
  onSave: (id: string) => void
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  index: number
  total: number
}) {
  const [content, setContent] = useState(subsection.content)
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false)
  const [materialsCount, setMaterialsCount] = useState(0)
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiText, setAiText] = useState<string | null>(null)
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [showTableInsert, setShowTableInsert] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateDisabled, setTemplateDisabled] = useState(false)
  const userId = useAppSelector((s) => s.auth.user?.id)

  useEffect(() => {
    // Re-enable when user logs in so we can retry
    if (userId) setTemplateDisabled(false)
  }, [userId])

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
          query: { section: toSectionNumber(subsection.subsectionNumber) || subsection.subsectionNumber },
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
  }, [templateDisabled, userId, subsection.subsectionNumber])

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
            <span className="text-base font-bold text-foreground">{subsection.subsectionNumber}</span>
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
            onClick={() => setShowTemplate(true)}
            className="text-xs"
            disabled={!userId || templateDisabled}
            title={!userId ? "Login required to view template" : templateDisabled ? "Template unavailable" : undefined}
            data-tour="detailed-template"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
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
      </div>

      <div className="px-6 py-4" data-tour="editor-toolbar">
        <TiptapEditor
          content={content}
          onChange={setContent}
          materialsCount={materialsCount}
          onOpenMaterials={() => setShowMaterialsDialog(true)}
          onAiGenerate={handleAiGenerate}
          aiGenerating={aiLoading}
          sectionNumber={subsection.subsectionNumber}
        />
      </div>

      <div className="border-t border-border px-6 py-4 bg-card/80 backdrop-blur-sm" data-tour="save-approve">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Section {subsection.subsectionNumber}</div>
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
          number: toSectionNumber(subsection.subsectionNumber) || subsection.subsectionNumber,
          title: subsection.title,
        }}
        onUnavailable={() => setTemplateDisabled(true)}
        onAvailable={() => setTemplateDisabled(false)}
      />

      <MaterialsDialog
        open={showMaterialsDialog}
        onOpenChange={setShowMaterialsDialog}
        keyword=""
        materials={materials}
        onMaterialsChange={(items) => {
          setMaterials(items)
          setMaterialsCount(items.length)
        }}
        onMaterialsCountChange={setMaterialsCount}
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
        subsectionNumber={subsection.subsectionNumber}
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
}: SectionEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)

  const scrollToSubsection = (subsectionNumber: string) => {
    const element = document.getElementById(`section-${subsectionNumber}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.replaceState(null, "", `#section-${subsectionNumber}`)
    }
  }

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

        {subsectionsToShow.length > 1 && (
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border mb-6 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3" data-tour="jump-navigation">
                <span className="text-sm font-medium text-muted-foreground">Jump to section:</span>
                <div className="flex gap-2 flex-wrap">
                  {subsectionsToShow.map((sub) => (
                    <Button
                      key={sub.id}
                      variant="outline"
                      size="sm"
                      onClick={() => scrollToSubsection(sub.subsectionNumber)}
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
        ) : (
          subsectionsToShow.map((subsection, index) => (
            <div key={subsection.id}>
              <SubsectionEditor
                subsection={subsection}
                onSave={() => {}}
                onApprove={() => {}}
                onDelete={onDeleteSubsection}
                index={index}
                total={subsectionsToShow.length}
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
