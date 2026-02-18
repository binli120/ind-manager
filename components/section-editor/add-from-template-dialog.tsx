// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronRight, FileText, Folder, FolderOpen, Loader2 } from "lucide-react"
import { useAppSelector } from "@/lib/store"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { getSectionTemplateEntries, type SectionTemplateEntry } from "@/lib/section-list-mapping"
import { cn } from "@/lib/utils"

type TemplateOption = {
  id: string
  value: string
  text: string
  desc?: string
  textPath: string
  parentTextPath: string
  parentId: string | null
  depth: number
  hasChildren: boolean
  type: "folder" | "file" | "unknown"
  raw: SectionTemplateEntry
}

const sanitizePathSegment = (value: string) =>
  value
    .trim()
    .replace(/[\\/]/g, " - ")
    .replace(/\s+/g, " ")

const toDocxBaseName = (value: string) =>
  sanitizePathSegment(value).replace(/\.docx$/i, "").trim()

const toTemplateOptions = (entries: SectionTemplateEntry[]): TemplateOption[] => {
  const result: TemplateOption[] = []
  const stack: TemplateOption[] = []

  entries.forEach((entry, idx) => {
    const requestedDepth = Number.isFinite(entry.depth) ? Math.max(0, entry.depth) : 0
    const depth = Math.min(requestedDepth, stack.length)
    while (stack.length > depth) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    const safeText = sanitizePathSegment(entry.text)
    const textPath = parent ? `${parent.textPath}/${safeText}` : safeText

    const option: TemplateOption = {
      id: entry.id || `${entry.value}-${idx}`,
      value: entry.value,
      text: entry.text,
      desc: entry.desc,
      textPath,
      parentTextPath: parent?.textPath ?? "",
      parentId: parent?.id ?? null,
      depth,
      hasChildren: false,
      type: entry.type,
      raw: entry,
    }
    result.push(option)
    stack.push(option)
  })

  const childCountByParent = new Map<string, number>()
  result.forEach((opt) => {
    if (!opt.parentId) return
    childCountByParent.set(opt.parentId, (childCountByParent.get(opt.parentId) ?? 0) + 1)
  })

  return result.map((opt) => ({
    ...opt,
    hasChildren: (childCountByParent.get(opt.id) ?? 0) > 0,
  }))
}

interface AddFromTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (sectionNumber: string, createdKey?: string) => void
  projectId?: string | null
  company?: string | null
  projectName?: string | null
  s3Key?: string | null
  bucket?: string | null
}

export function AddFromTemplateDialog({
  open,
  onOpenChange,
  onCreate,
  projectId,
  company,
  projectName,
  s3Key,
  bucket,
}: AddFromTemplateDialogProps) {
  const userId = useAppSelector((s) => s.auth.user?.id)
  const [options, setOptions] = useState<TemplateOption[]>(() => toTemplateOptions(getSectionTemplateEntries()))
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const selected = useMemo(() => options.find((opt) => opt.id === selectedId), [options, selectedId])
  const optionById = useMemo(
    () => new Map(options.map((opt) => [opt.id, opt] as const)),
    [options],
  )
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set())
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedId(undefined)
    setExpandedFolderIds(new Set())
    setFileName("")
    setError(null)
    const normalized = toTemplateOptions(getSectionTemplateEntries())
    setOptions(normalized)
    if (!normalized.length) {
      setError("No template sections available.")
    }
  }, [open])

  const visibleOptions = useMemo(
    () =>
      options.filter((opt) => {
        let parentId = opt.parentId
        while (parentId) {
          if (!expandedFolderIds.has(parentId)) return false
          parentId = optionById.get(parentId)?.parentId ?? null
        }
        return true
      }),
    [expandedFolderIds, optionById, options],
  )

  const handleCreate = async () => {
    if (!selected) return
    if (!projectId) {
      setError("Project is required to create a file.")
      return
    }
    const baseName = selected.type === "folder" ? toDocxBaseName(fileName) : toDocxBaseName(selected.text)
    if (!baseName) return
    const finalName = baseName.toLowerCase().endsWith(".docx") ? baseName : `${baseName}.docx`

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId ?? "")}/section-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "user-id": userId } : {}),
        },
        body: JSON.stringify({
          selectionPath: selected.value,
          selectionTextPath: selected.textPath,
          selectionType: selected.type === "folder" ? "folder" : "file",
          fileName: finalName,
          company,
          projectName,
          s3Key,
          bucket,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        const msg =
          (payload && typeof payload.message === "string" && payload.message) ||
          (payload && typeof payload.error === "string" && payload.error) ||
          `Create request failed (${res.status})`
        throw new Error(msg)
      }

      const payload = (await res.json().catch(() => ({}))) as { key?: string }
      onCreate(selected.value, payload.key)
      toast.success(`Created ${finalName}`)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create file"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = Boolean(selected && (selected.type !== "folder" || fileName.trim()) && !loading)

  const handleTreeItemClick = (opt: TemplateOption) => {
    setSelectedId(opt.id)
    if (opt.type !== "folder") return
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(opt.id)) {
        next.delete(opt.id)
      } else {
        next.add(opt.id)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Template Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-hidden">
          <p className="text-sm text-muted-foreground">
            Choose from the configured section template. Clicking uses the mapped section number (`value`) for API calls.
          </p>
          <div className="rounded-md border border-border max-h-64 overflow-y-auto overscroll-contain">
            <div className="p-1">
              {visibleOptions.map((opt) => {
                const isSelected = selectedId === opt.id
                const isFolder = opt.type === "folder"
                const isExpanded = expandedFolderIds.has(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleTreeItemClick(opt)}
                    className={cn(
                      "w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted/70",
                      isSelected && "bg-violet-600/20 text-violet-900 dark:text-violet-200",
                    )}
                    style={{ paddingLeft: `${8 + opt.depth * 14}px` }}
                    title={opt.desc ?? opt.text}
                    disabled={loading}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {isFolder ? (
                        <>
                          {opt.hasChildren ? (
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 flex-shrink-0 transition-transform",
                                isExpanded && "rotate-90",
                              )}
                            />
                          ) : (
                            <span className="h-3.5 w-3.5 flex-shrink-0" />
                          )}
                          {isExpanded ? (
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                        </>
                      ) : (
                        <>
                          <span className="h-3.5 w-3.5 flex-shrink-0" />
                          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </>
                      )}
                      <span className="truncate">{opt.text}</span>
                    </span>
                  </button>
                )
              })}
              {!loading && !visibleOptions.length && (
                <div className="px-2 py-2 text-sm text-muted-foreground">No template sections available.</div>
              )}
            </div>
          </div>
          {selected?.type === "folder" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selected item is a folder. Provide a file name to create inside it.
              </p>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter new file name (without .docx)"
                disabled={loading}
              />
            </div>
          )}
          {error && <div className="text-sm text-destructive">{error}</div>}
          {!error && !loading && !options.length && (
            <div className="text-sm text-muted-foreground">No sections available.</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleCreate} disabled={!canSubmit}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
