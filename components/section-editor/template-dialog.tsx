// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Template, TemplateRow } from "@/types/section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import { Pencil, Save, X, Table, RotateCcw } from "lucide-react"
import { TableEditorDialog } from "./table-editor-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractSectionNumber } from "@/lib/section-editor/section-number"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"
import { useAppSelector } from "@/lib/store"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TemplateDialogProps {
  section: {
    id: string
    number: string
    title?: string
    subsections?: { subsectionNumber: string }[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnavailable?: () => void
  onAvailable?: () => void
}

type ApiTemplateEntry = Record<string, unknown>

export const normalizeRow = (entry: ApiTemplateEntry): TemplateRow => {
  const modalities = (entry.modalities as Partial<TemplateRow["modalities"]>) || {}
  const requiredFlag =
    (entry.indRequirement as TemplateRow["indRequirement"]) ??
    (entry.ind_requirement as TemplateRow["indRequirement"]) ??
    ((entry.required as boolean | undefined) ? "Required" : undefined) ??
    "Required"

  const rawValue = entry.raw ?? entry
  const rawString =
    typeof rawValue === "string"
      ? rawValue
      : (() => {
          try {
            return JSON.stringify(rawValue, null, 2)
          } catch {
            return ""
          }
        })()

  const pickModality = (patterns: string[]): string | undefined => {
    const lowerPatterns = patterns.map((p) => p.toLowerCase())
    for (const [key, value] of Object.entries(entry)) {
      if (typeof value !== "string") continue
      const lowerKey = key.toLowerCase()
      if (lowerPatterns.some((p) => lowerKey.includes(p))) {
        return value
      }
    }
    return undefined
  }

  const elementNumber =
    (entry.element_number as string | undefined) ??
    (entry.subSectionNumbering as string | undefined) ??
    (entry.sub_section_numbering as string | undefined) ??
    (entry.subSectionNumbering as string | undefined)

  return {
    id:
      (entry.id as string | undefined) ??
      elementNumber ??
      `${entry.section ?? entry.section_number ?? "row"}-${entry.subsection ?? entry.subsection_number ?? "0"}`,
    section: (entry.section as string | undefined) ?? (entry.section_number as string | undefined) ?? "",
    sectionHeader:
      (entry.sectionHeader as string | undefined) ??
      (entry.section_header as string | undefined) ??
      (entry.header as string | undefined) ??
      "",
    subsection: (entry.subsection as string | undefined) ?? (entry.subsection_number as string | undefined) ?? "",
    subsectionHeader:
      (entry.subsectionHeader as string | undefined) ??
      (entry.subsection_header as string | undefined) ??
      (entry.title as string | undefined) ??
      "",
    subSectionNumbering:
      (entry.subSectionNumbering as string | undefined) ??
      (entry.sub_section_numbering as string | undefined) ??
      (entry.element as string | undefined) ??
      (entry.subsection as string | undefined) ??
      (entry.section as string | undefined) ??
      "",
    indRequirement: requiredFlag,
    content:
      (entry.content as string | undefined) ??
      (entry.text as string | undefined) ??
      (entry.body as string | undefined) ??
      "",
    modalities: {
      sm:
        modalities.sm ??
        (entry.sm as string | undefined) ??
        pickModality(["sm", "small molecule", "small-molecule"]) ??
        "",
      bio:
        modalities.bio ??
        (entry.bio as string | undefined) ??
        pickModality(["bio", "biologic", "biological"]) ??
        "",
      adc:
        modalities.adc ??
        (entry.adc as string | undefined) ??
        pickModality(["adc", "antibody-drug", "antibody drug"]) ??
        "",
      ont:
        modalities.ont ??
        (entry.ont as string | undefined) ??
        pickModality(["ont", "oligo", "oligonucleotide"]) ??
        "",
      other:
        modalities.other ??
        (entry.other as string | undefined) ??
        pickModality(["other", "misc"]) ??
        "",
    },
    raw: rawString,
  }
}

export const flattenRows = (data: unknown): TemplateRow[] => {
  const result: TemplateRow[] = []
  const seen = new Set<string>()

  const ensureId = (base: string, idx: number) => {
    if (!base) {
      base = `row-${idx}`
    }
    let candidate = base
    let counter = 1
    while (seen.has(candidate)) {
      candidate = `${base}__${counter++}`
    }
    seen.add(candidate)
    return candidate
  }

  const pushNormalized = (rows: unknown[]) => {
    rows.forEach((row, idx) => {
      const normalized = normalizeRow(row as ApiTemplateEntry)
      const id = ensureId(normalized.id || "", idx)
      result.push({ ...normalized, id })
    })
  }

  if (!data) return result

  if (Array.isArray(data)) {
    pushNormalized(data)
    return result
  }

  if (typeof data === "object") {
    if (Array.isArray((data as { entries?: unknown }).entries)) {
      pushNormalized((data as { entries: unknown[] }).entries)
      return result
    }
    const maybeRows = (data as { rows?: unknown }).rows
    if (Array.isArray(maybeRows)) {
      pushNormalized(maybeRows)
      return result
    }

    const values = Object.values(data as Record<string, unknown>)
    if (values.length && values.every((v) => typeof v === "object")) {
      values.forEach((v) => {
        const nested = flattenRows(v)
        nested.forEach((row, idx) => {
          const id = ensureId(row.id || "", idx)
          result.push({ ...row, id })
        })
      })
      return result
    }
  }

  return result
}

const default_table = `
  <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Study Type</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Study ID</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Test System</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Route</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Key Findings</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">Primary Pharmacodynamics</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">PD-001</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">In vitro</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">N/A</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">IC50 = 2.3 nM for target kinase inhibition</td>
        </tr>
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">Secondary Pharmacology</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">PD-002</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">In vitro panel</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">N/A</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">No significant off-target activity up to 10 μM</td>
        </tr>
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">Safety Pharmacology - CV</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">SP-001</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">hERG assay</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">In vitro</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">IC50 > 30 μM, no significant hERG liability</td>
        </tr>
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">PK/PD Studies</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">PKPD-001</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">Mouse xenograft</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">PO</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">Dose-dependent tumor growth inhibition observed</td>
        </tr>
      </tbody>
    </table>
  `
type EditingField = {
  rowId: string
  field: string
}

export function TemplateDialog({ section, open, onOpenChange, onUnavailable, onAvailable }: TemplateDialogProps) {
  const userId = useAppSelector((s) => s.auth.user?.id)

  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [editedRows, setEditedRows] = useState<TemplateRow[]>([])
  const [baseRows, setBaseRows] = useState<TemplateRow[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastFetchKey, setLastFetchKey] = useState<string | null>(null)

  const [tableEditorOpen, setTableEditorOpen] = useState(false)
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)
  const [showTableRevertConfirm, setShowTableRevertConfirm] = useState(false)
  const [tableContent, setTableContent] = useState(default_table)

  useEffect(() => {
    if (!open) return
    const loadTemplate = async () => {
      if (!userId || !userId.trim()) {
        setError("Login required to load template")
        setBaseRows([])
        setEditedRows([])
        setLoading(false)
        onUnavailable?.()
        return
      }
      const sectionParam = extractSectionNumber(section.number) || section.number
      const fetchKey = `${sectionParam}-${userId}`
      if (fetchKey === lastFetchKey) return
      setLastFetchKey(fetchKey)
      setLoading(true)
      setError(null)
      try {
        console.info("[TemplateDialog] Fetch template", {
          sectionParam,
          userId,
        })
        const response = await requestPdfAnalysisApi<
          Record<string, unknown>,
          undefined,
          { section: string }
        >({
          path: "/ncd/template",
          method: "GET",
          query: { section: sectionParam },
          userIdHeader: userId ?? null,
          headers: { "user-id": userId },
          suppressErrorLog: true,
          allowRedirects: false,
        })

        const rows = flattenRows(response)
        setBaseRows(rows)
        setEditedRows(rows)
        setLastUpdated(new Date().toISOString().slice(0, 10))
        if (!rows.length) {
          onUnavailable?.()
        } else {
          onAvailable?.()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template")
        onUnavailable?.()
      } finally {
        setLoading(false)
      }
    }

    void loadTemplate()
  }, [open, section.number, userId, onAvailable, onUnavailable, lastFetchKey])

  const selectedTemplate: Template = useMemo(
    () => ({
      id: "remote",
      name: "Template",
      type: "project",
      isDefault: true,
      canEdit: true,
      lastUpdated: lastUpdated ?? "",
      rows: editedRows,
    }),
    [editedRows, lastUpdated],
  )

  const handleModalityEdit = (rowId: string, modality: keyof TemplateRow["modalities"], value: string) => {
    setEditedRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, modalities: { ...row.modalities, [modality]: value } } : row)),
    )
  }

  const handleSaveField = async () => {
    if (!editingField) return
    if (!userId) {
      setError("User not authenticated")
      toast.error("Please log in to save template changes.")
      return
    }

    const row = editedRows.find((r) => r.id === editingField.rowId)
    if (!row) return

    setIsSaving(true)
    setError(null)
    try {
      await requestPdfAnalysisApi({
        path: "/ncd/template/override",
        method: "POST",
        body: {
          user_id: userId,
          section: row.section,
          subsection: row.subsection,
          payload: {
            ...row,
            indRequirement: rowRequirements[row.id] ?? row.indRequirement,
            modalities: row.modalities,
          },
        },
        userIdHeader: userId,
        headers: { "user-id": userId },
        suppressErrorLog: true,
        allowRedirects: false,
      })
      setBaseRows(editedRows)
      setLastUpdated(new Date().toISOString().slice(0, 10))
      setEditingField(null)
      toast.success("Template override saved")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save override")
      toast.error(err instanceof Error ? err.message : "Failed to save template")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelField = () => {
    setEditedRows(baseRows)
    setEditingField(null)
  }

  const isFieldEditing = (rowId: string, field: string) => {
    return editingField?.rowId === rowId && editingField?.field === field
  }

  const isPharmacologyTableSection =
    ["2.6.3", "2.6.5", "2.6.7"].some((id) => section.number.includes(id)) || section.subsections?.some((sub) => ["2.6.3", "2.6.5", "2.6.7"].some((id) => sub.subsectionNumber.includes(id)))

  const [rowRequirements, setRowRequirements] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!editedRows.length) return
    const defaults: Record<string, string> = {}
    editedRows.forEach((row) => {
      defaults[row.id] = row.indRequirement || "Required"
      defaults[`${row.id}-sm`] = "Required"
      defaults[`${row.id}-bio`] = "Required"
      defaults[`${row.id}-adc`] = "Required"
      defaults[`${row.id}-ont`] = "Required"
      defaults[`${row.id}-other`] = "Required"
    })
    setRowRequirements(defaults)
  }, [editedRows])

  const handleRequirementChange = (rowId: string, value: string) => {
    setRowRequirements((prev) => ({ ...prev, [rowId]: value }))
  }

  const handleRevert = () => {
    setEditedRows(baseRows)
    setRowRequirements(
      Object.fromEntries(baseRows.map((row) => [row.id, row.indRequirement || "Required"])),
    )
    setEditingField(null)
    setShowRevertConfirm(false)
  }

  const handleTableRevert = () => {
    setTableContent(default_table)
    setShowTableRevertConfirm(false)
  }

  const getRequirementColor = (requirement: string) => {
    switch (requirement) {
      case "Required":
        return "text-red-600"
      case "Optional":
        return "text-yellow-700"
      case "Not Applicable":
        return "text-green-700"
      default:
        return ""
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-none w-[98vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Templates - {section.number}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 pb-4 border-b">
            <Badge variant="secondary">{lastUpdated ? `Updated ${lastUpdated}` : "Loaded"}</Badge>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading template…
              </div>
            )}
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowRevertConfirm(true)}
              disabled={loading || !baseRows.length}
            >
              <RotateCcw className="h-4 w-4" />
              Revert to Default
            </Button>
          </div>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {!loading && !editedRows.length && (
                <div className="text-sm text-muted-foreground border rounded-lg p-4">
                  No template content found for section {section.number}.
                </div>
              )}
              {!isPharmacologyTableSection &&
                editedRows.map((row) => (
                  <div key={row.id} className="border rounded-lg p-6 bg-card space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{row.content || row.sectionHeader || "Template Block"}</h3>
                        <div className="text-sm text-muted-foreground">
                          {row.sectionHeader || row.section}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {row.section && (
                          <Badge variant="secondary" className="font-mono text-[11px]">
                            Section {row.section}
                          </Badge>
                        )}
                        {row.subsection && (
                          <Badge variant="outline" className="font-mono text-[11px]">
                            Subsection {row.subsection}
                          </Badge>
                        )}
                        {row.subSectionNumbering && (
                          <Badge variant="outline" className="font-mono text-[11px] bg-muted/60">
                            Element {row.subSectionNumbering}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-muted-foreground font-medium">Section</label>
                        <div className="mt-1">{row.section || "—"}</div>
                      </div>
                      <div>
                        <label className="text-muted-foreground font-medium">Subsection</label>
                        <div className="mt-1">{row.subsection || "—"}</div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-muted-foreground font-medium">Section Header</label>
                        <div className="mt-1">{row.sectionHeader}</div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-muted-foreground font-medium">Subsection Header</label>
                        <div className="mt-1">{row.subsectionHeader}</div>
                      </div>
                      <div>
                        <label className="text-muted-foreground font-medium">Subsection Element Numbering</label>
                        <div className="mt-1">{row.subSectionNumbering || "—"}</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-muted-foreground font-medium text-sm">
                          Block Header (content)
                        </label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={rowRequirements[row.id] || "Required"}
                            onValueChange={(value) => handleRequirementChange(row.id, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[row.id] || "Required")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Required" className="text-red-600">
                                Required
                              </SelectItem>
                              <SelectItem value="Optional" className="text-yellow-700">
                                Optional
                              </SelectItem>
                              <SelectItem value="Not Applicable" className="text-green-700">
                                Not Applicable
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedTemplate.canEdit && !isFieldEditing(row.id, "content") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingField({ rowId: row.id, field: "content" })}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {isFieldEditing(row.id, "content") && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleSaveField}
                                disabled={isSaving}
                                className="h-7 gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelField}
                                className="h-7 gap-1 bg-transparent"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {isFieldEditing(row.id, "content") ? (
                        <input
                          value={row.content}
                          onChange={(e) =>
                            setEditedRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, content: e.target.value } : r)),
                            )
                          }
                          className="w-full mt-2 h-10 px-3 border border-border rounded-md bg-background"
                        />
                      ) : (
                        <div className="mt-1 p-3 bg-muted/30 rounded text-sm">{row.content}</div>
                      )}
                      <div className="mt-3">
                        <label className="text-muted-foreground font-medium text-sm">Raw</label>
                        <textarea
                          value={row.raw || ""}
                          readOnly
                          className="w-full mt-2 min-h-[140px] p-3 border border-border rounded-md bg-muted/20 font-mono text-xs resize-y"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h4 className="font-medium text-sm">Modality-Specific Content</h4>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-semibold">
                              SM
                            </span>
                            Small Molecule
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                            value={rowRequirements[`${row.id}-sm`] || "Required"}
                            onValueChange={(value) => handleRequirementChange(`${row.id}-sm`, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-sm`] || "Required")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Required" className="text-red-600">
                                Required
                              </SelectItem>
                                <SelectItem value="Optional" className="text-yellow-700">
                                  Optional
                                </SelectItem>
                                <SelectItem value="Not Applicable" className="text-green-700">
                                  Not Applicable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedTemplate.canEdit && !isFieldEditing(row.id, "sm") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingField({ rowId: row.id, field: "sm" })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {isFieldEditing(row.id, "sm") && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={handleSaveField}
                                  disabled={isSaving}
                                  className="h-7 gap-1"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelField}
                                  className="h-7 gap-1 bg-transparent"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={row.modalities.sm}
                          onChange={(e) => handleModalityEdit(row.id, "sm", e.target.value)}
                          readOnly={!isFieldEditing(row.id, "sm")}
                          className={`w-full mt-2 ${row.modalities.sm?.trim() ? "min-h-[120px]" : "h-10"} p-3 border border-border rounded-md bg-background text-sm resize-y whitespace-pre-wrap`}
                          placeholder="Enter small molecule specific content..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-900 rounded text-xs font-semibold">
                              BIO
                            </span>
                            Biologics
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                            value={rowRequirements[`${row.id}-bio`] || "Required"}
                            onValueChange={(value) => handleRequirementChange(`${row.id}-bio`, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-bio`] || "Required")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Required" className="text-red-600">
                                Required
                              </SelectItem>
                                <SelectItem value="Optional" className="text-yellow-700">
                                  Optional
                                </SelectItem>
                                <SelectItem value="Not Applicable" className="text-green-700">
                                  Not Applicable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedTemplate.canEdit && !isFieldEditing(row.id, "bio") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingField({ rowId: row.id, field: "bio" })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {isFieldEditing(row.id, "bio") && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={handleSaveField}
                                  disabled={isSaving}
                                  className="h-7 gap-1"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelField}
                                  className="h-7 gap-1 bg-transparent"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={row.modalities.bio}
                          onChange={(e) => handleModalityEdit(row.id, "bio", e.target.value)}
                          readOnly={!isFieldEditing(row.id, "bio")}
                          className={`w-full mt-2 ${row.modalities.bio?.trim() ? "min-h-[120px]" : "h-10"} p-3 border border-border rounded-md bg-background text-sm resize-y whitespace-pre-wrap`}
                          placeholder="Enter biologics specific content..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-900 rounded text-xs font-semibold">
                              ADC
                            </span>
                            Antibody-Drug Conjugate
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                            value={rowRequirements[`${row.id}-adc`] || "Required"}
                            onValueChange={(value) => handleRequirementChange(`${row.id}-adc`, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-adc`] || "Required")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Required" className="text-red-600">
                                Required
                              </SelectItem>
                                <SelectItem value="Optional" className="text-yellow-700">
                                  Optional
                                </SelectItem>
                                <SelectItem value="Not Applicable" className="text-green-700">
                                  Not Applicable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedTemplate.canEdit && !isFieldEditing(row.id, "adc") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingField({ rowId: row.id, field: "adc" })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {isFieldEditing(row.id, "adc") && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={handleSaveField}
                                  disabled={isSaving}
                                  className="h-7 gap-1"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelField}
                                  className="h-7 gap-1 bg-transparent"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={row.modalities.adc}
                          onChange={(e) => handleModalityEdit(row.id, "adc", e.target.value)}
                          readOnly={!isFieldEditing(row.id, "adc")}
                          className={`w-full mt-2 ${row.modalities.adc?.trim() ? "min-h-[120px]" : "h-10"} p-3 border border-border rounded-md bg-background text-sm resize-y whitespace-pre-wrap`}
                          placeholder="Enter ADC specific content..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-900 rounded text-xs font-semibold">
                              ONT
                            </span>
                            Oligonucleotide
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                            value={rowRequirements[`${row.id}-ont`] || "Required"}
                            onValueChange={(value) => handleRequirementChange(`${row.id}-ont`, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-ont`] || "Required")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Required" className="text-red-600">
                                Required
                              </SelectItem>
                                <SelectItem value="Optional" className="text-yellow-700">
                                  Optional
                                </SelectItem>
                                <SelectItem value="Not Applicable" className="text-green-700">
                                  Not Applicable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedTemplate.canEdit && !isFieldEditing(row.id, "ont") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingField({ rowId: row.id, field: "ont" })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {isFieldEditing(row.id, "ont") && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={handleSaveField}
                                  disabled={isSaving}
                                  className="h-7 gap-1"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelField}
                                  className="h-7 gap-1 bg-transparent"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={row.modalities.ont}
                          onChange={(e) => handleModalityEdit(row.id, "ont", e.target.value)}
                          readOnly={!isFieldEditing(row.id, "ont")}
                          className={`w-full mt-2 ${row.modalities.ont?.trim() ? "min-h-[120px]" : "h-10"} p-3 border border-border rounded-md bg-background text-sm resize-y whitespace-pre-wrap`}
                          placeholder="Enter oligonucleotide specific content..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <span className="px-2 py-1 bg-pink-100 text-pink-900 rounded text-xs font-semibold">
                              Other
                            </span>
                            Other Modality
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                            value={rowRequirements[`${row.id}-other`] || "Required"}
                            onValueChange={(value) => handleRequirementChange(`${row.id}-other`, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-other`] || "Required")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Required" className="text-red-600">
                                Required
                              </SelectItem>
                                <SelectItem value="Optional" className="text-yellow-700">
                                  Optional
                                </SelectItem>
                                <SelectItem value="Not Applicable" className="text-green-700">
                                  Not Applicable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedTemplate.canEdit && !isFieldEditing(row.id, "other") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingField({ rowId: row.id, field: "other" })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {isFieldEditing(row.id, "other") && (
                              <div className="flex items-center gap-2">
                                <Button variant="default" size="sm" onClick={handleSaveField} className="h-7 gap-1">
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelField}
                                  className="h-7 gap-1 bg-transparent"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={row.modalities.other}
                          onChange={(e) => handleModalityEdit(row.id, "other", e.target.value)}
                          readOnly={!isFieldEditing(row.id, "other")}
                          className={`w-full mt-2 ${row.modalities.other?.trim() ? "min-h-[120px]" : "h-10"} p-3 border border-border rounded-md bg-background text-sm resize-y whitespace-pre-wrap`}
                          placeholder="Enter other modality specific content..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              {isPharmacologyTableSection && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Table className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Tabulate Template</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowTableRevertConfirm(true)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Revert to Default
                      </Button>
                      <Button
                        onClick={() => setTableEditorOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Table
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      This tabulate template provides a structured format for summarizing pharmacology study data. The
                      table includes key study information including study type, study identifier, test system, route of
                      administration, and key findings.
                    </p>
                    <p>
                      You can customize this template by clicking the &quot;Edit Table&quot; button to add or remove rows and
                      columns, modify headers, or update cell content to match your specific study requirements.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 overflow-x-auto">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: tableContent }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {tableEditorOpen && (
        <TableEditorDialog
          open={tableEditorOpen}
          onOpenChange={setTableEditorOpen}
          initialContent={tableContent}
          onSave={setTableContent}
        />
      )}

      <Dialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Revert to Template Default</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            This action will discard your current changes and restore the default template for this section. Are you sure?
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRevert} className="w-full">
              Revert
            </Button>
            <Button onClick={() => setShowRevertConfirm(false)} variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTableRevertConfirm} onOpenChange={setShowTableRevertConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Revert Table to Default</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            This action will discard your table customizations and restore the system default structure. Are you sure?
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleTableRevert} className="w-full">
              Revert
            </Button>
            <Button onClick={() => setShowTableRevertConfirm(false)} variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
