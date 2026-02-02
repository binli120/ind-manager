// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, RefreshCw } from "lucide-react"
import { useAppSelector } from "@/lib/store"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

type TemplateOption = {
  id: string
  label: string
  valuePath: string
  textPath: string
  parentTextPath: string
  depth: number
  type: "folder" | "file" | "unknown"
  relativePath: string
  parentPath: string
  raw: unknown
}

const inferLabel = (item: Record<string, unknown>): string | null => {
  const candidates = ["section", "number", "name", "title", "value", "text", "label", "id"]
  for (const key of candidates) {
    const val = item[key]
    if (typeof val === "string" && val.trim()) return val.trim()
    if (typeof val === "number") return String(val)
  }
  return null
}

const inferType = (item: Record<string, unknown>, hasChildren: boolean): TemplateOption["type"] => {
  const rawType = item.type || item.kind || item.itemType || item.nodeType
  if (typeof rawType === "string") {
    const lowered = rawType.toLowerCase()
    if (lowered.includes("folder") || lowered === "dir" || lowered === "directory") return "folder"
    if (lowered.includes("file")) return "file"
  }
  if (item.isFolder === true || item.folder === true) return "folder"
  if (hasChildren) return "folder"
  return "file"
}

const extractChildren = (item: Record<string, unknown>): unknown[] | null => {
  const candidates = ["children", "items", "sections", "contents"]
  for (const key of candidates) {
    const val = item[key]
    if (Array.isArray(val)) return val
  }
  return null
}

const normalizeSectionList = (payload: unknown): TemplateOption[] => {
  if (!payload) return []

  // Special-case flat list with depth (shape from /ncd/sectionList)
  if (typeof payload === "object" && payload !== null && Array.isArray((payload as Record<string, unknown>).sections)) {
    const items = (payload as { sections: unknown[] }).sections
    const results: TemplateOption[] = []
    const stack: { depth: number; valuePath: string; textPath: string }[] = []

    items.forEach((entry, idx) => {
      if (!entry || typeof entry !== "object") return
      const obj = entry as Record<string, unknown>
      const depth = Number.isFinite(obj.depth) ? (obj.depth as number) : 0
      const label =
        (typeof obj.text === "string" && obj.text.trim()) ||
        inferLabel(obj) ||
        (typeof obj.value === "string" && obj.value.trim()) ||
        (typeof obj.id === "string" && obj.id.trim())
      if (!label) return

      // Trim leading indentation spaces from text if present
      const cleanLabel = label.replace(/^\s+/, "")
      const valuePart = (typeof obj.value === "string" && obj.value.trim()) || cleanLabel

      while (stack.length && stack[stack.length - 1].depth >= depth) {
        stack.pop()
      }

      const parent = stack[stack.length - 1]
      const valuePath = parent ? [parent.valuePath, valuePart].filter(Boolean).join("/") : valuePart
      const textPath = parent ? [parent.textPath, cleanLabel].filter(Boolean).join("/") : cleanLabel
      const parentTextPath = parent ? parent.textPath : ""
      const relativePath = valuePath
      const parentPath = parent ? parent.valuePath : ""
      const type = inferType(obj, false)

      const option: TemplateOption = {
        id: obj.id && typeof obj.id === "string" ? obj.id : `${relativePath}-${idx}`,
        label: cleanLabel,
        valuePath,
        textPath,
        parentTextPath,
        depth,
        type,
        relativePath,
        parentPath,
        raw: entry,
      }
      results.push(option)
      stack.push({ depth, valuePath, textPath })
    })
    return results
  }

  const results: TemplateOption[] = []

  const visit = (entry: unknown, depth: number, ancestors: string[]) => {
    if (typeof entry === "string" || typeof entry === "number") {
      const label = typeof entry === "string" ? entry.trim() : String(entry)
      if (!label) return
      const pathParts = [...ancestors, label]
      const relativePath = pathParts.join("/")
      const parentPath = pathParts.slice(0, -1).join("/")
      results.push({
        id: `${relativePath || label}-${results.length}`,
        label,
        valuePath: relativePath,
        textPath: relativePath,
        parentTextPath: parentPath,
        depth,
        type: "file",
        relativePath,
        parentPath,
        raw: entry,
      })
      return
    }

    if (!entry || typeof entry !== "object") return
    const obj = entry as Record<string, unknown>
    const children = extractChildren(obj)
    const label = inferLabel(obj)
    if (!label) return

    const providedDepth = Number.isFinite(obj.depth) ? (obj.depth as number) : depth
    const type = inferType(obj, Boolean(children && children.length))

    const pathFromField = (() => {
      const pathCandidate = obj.path || obj.fullPath || obj.s3Path || obj.location || obj.key
      if (typeof pathCandidate === "string" && pathCandidate.trim()) return pathCandidate.trim().replace(/^\/+|\/+$/g, "")
      return null
    })()

    const pathParts = pathFromField ? pathFromField.split("/").filter(Boolean) : [...ancestors, label]
    const relativePath = pathParts.join("/")
    const parentPath = pathParts.slice(0, -1).join("/")

    results.push({
      id: `${relativePath || label}-${results.length}`,
      label,
      valuePath: relativePath,
      textPath: relativePath,
      parentTextPath: parentPath,
      depth: providedDepth,
      type,
      relativePath,
      parentPath,
      raw: entry,
    })

    if (children && children.length) {
      children.forEach((child) => visit(child, providedDepth + 1, pathParts))
    }
  }

  if (Array.isArray(payload)) {
    payload.forEach((item) => visit(item, 0, []))
    return results
  }

  if (typeof payload === "object") {
    Object.values(payload).forEach((item) => visit(item, 0, []))
    return results
  }

  return []
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
  const [options, setOptions] = useState<TemplateOption[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const selected = useMemo(() => options.find((opt) => opt.id === selectedId), [options, selectedId])
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    if (!userId) {
      setError("Login required to load template sections.")
      setOptions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await requestPdfAnalysisApi<unknown>({
        path: "/ncd/sectionList",
        method: "GET",
        headers: { "user-id": userId },
        userIdHeader: userId,
        allowRedirects: false,
        suppressErrorLog: true,
      })
      const normalized = normalizeSectionList(response)
      setOptions(normalized)
      if (!normalized.length) {
        setError("No template sections available.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load template list."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!open) return
    setSelectedId(undefined)
    setFileName("")
    void fetchOptions()
  }, [open, fetchOptions])

  const handleCreate = async () => {
    if (!selected) return
    if (!projectId) {
      setError("Project is required to create a file.")
      return
    }
    const baseName = selected.type === "folder" ? fileName.trim() : selected.label
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
          selectionPath: selected.relativePath,
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
      onCreate(selected.relativePath || selected.label, payload.key)
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

const renderOptionLabel = (opt: TemplateOption) => (
  <span className="flex items-center gap-2" style={{ paddingLeft: `${opt.depth * 12}px` }}>
    <span className="text-muted-foreground text-xs uppercase tracking-wide">
      {opt.type === "folder" ? "Folder" : "File"}
    </span>
    <span className="font-mono text-sm text-foreground">{opt.label}</span>
    <span className="text-muted-foreground text-[11px]">({opt.valuePath})</span>
  </span>
)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Select Template Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose a template section to add a new editable block to your workspace. Sections use the numeric identifier
            (e.g., 2.4.1.1).
          </p>
          <div className="flex items-center gap-2">
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || !options.length}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loading ? "Loading sections…" : "Select a template section"}
                  className="flex items-center gap-2"
                >
                  {selected ? renderOptionLabel(selected) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-64">
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="flex items-center gap-2">
                      {renderOptionLabel(opt)}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => fetchOptions()} disabled={loading} title="Refresh list">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
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
