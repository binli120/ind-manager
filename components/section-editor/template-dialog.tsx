"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Template, TemplateRow, TemplateDialogProps } from "@/types/section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Pencil, Save, X, Table, RotateCcw } from "lucide-react"
import { TableEditorDialog } from "./table-editor-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const mockTemplates: Template[] = [
  {
    id: "proj-1",
    name: "Project Template",
    type: "project",
    isDefault: true,
    canEdit: true,
    lastUpdated: "2024-12-10",
    rows: [
      {
        id: "row-1",
        section: "2.4.1",
        sectionHeader: "Overview of the Nonclinical Testing Strategy",
        subsection: "2.4.1",
        subsectionHeader: "Overview of the Nonclinical Testing Strategy",
        subSectionNumbering: "2.4.1 - a",
        indRequirement: "Required",
        content:
          "Introduce the investigational product, including its chemical/biologic nature, pharmacological class, mechanism of action, and intended therapeutic indication(s). Provide context for the nonclinical program within the overall drug development plan.",
        modalities: {
          sm: "Describe the small molecule drug candidate including chemical class, molecular weight, physicochemical properties relevant to nonclinical testing, and pharmacological target.",
          bio: "Describe the biologic product type (e.g., monoclonal antibody, fusion protein, enzyme), target antigen/receptor, and key structural features. Address species specificity of target binding that influenced nonclinical program design.",
          adc: "Describe the ADC construct including the antibody component (target, isotype), linker chemistry (cleavable vs. non-cleavable), and payload (mechanism, drug class). Explain the rationale for evaluating the intact conjugate and any component testing.",
          ont: "Describe the oligonucleotide class (ASO, siRNA, aptamer), target gene/mRNA, mechanism of action (e.g., RNase H, RISC-mediated), and chemical modifications (e.g., phosphorothioate backbone, 2'-modifications) that influence nonclinical behavior.",
          other:
            "For cell/gene therapies: describe the product type, vector (if applicable), genetic payload or cell source, and mechanism of therapeutic effect. For vaccines: describe antigen(s), adjuvant(s), and intended immune response.",
        },
      },
    ],
  },
  {
    id: "comp-1",
    name: "Company Template",
    type: "company",
    isDefault: false,
    canEdit: false,
    lastUpdated: "2024-11-15",
    rows: [
      {
        id: "row-2",
        section: "2.4.1",
        sectionHeader: "Overview of the Nonclinical Testing Strategy",
        subsection: "2.4.1",
        subsectionHeader: "Overview of the Nonclinical Testing Strategy",
        subSectionNumbering: "2.4.1 - a",
        indRequirement: "Required",
        content:
          "Introduce the investigational product, including its chemical/biologic nature, pharmacological class, mechanism of action, and intended therapeutic indication(s). Provide context for the nonclinical program within the overall drug development plan.",
        modalities: {
          sm: "[Company standard SM template content]",
          bio: "[Company standard BIO template content]",
          adc: "[Company standard ADC template content]",
          ont: "[Company standard ONT template content]",
          other: "[Company standard Other Modality template content]",
        },
      },
    ],
  },
]

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

export function TemplateDialog({ section, open, onOpenChange }: TemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(mockTemplates[0])
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [editedRows, setEditedRows] = useState<TemplateRow[]>(selectedTemplate.rows)
  const [tableEditorOpen, setTableEditorOpen] = useState(false)
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)
  const [showTableRevertConfirm, setShowTableRevertConfirm] = useState(false)
  const [tableContent, setTableContent] = useState(default_table)

  const handleTemplateChange = (template: Template) => {
    setSelectedTemplate(template)
    setEditedRows(template.rows)
    setEditingField(null)
  }

  const handleModalityEdit = (rowId: string, modality: keyof TemplateRow["modalities"], value: string) => {
    setEditedRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, modalities: { ...row.modalities, [modality]: value } } : row)),
    )
  }

  const handleSaveField = () => {
    console.log("[v0] Saving field:", editingField)
    setEditingField(null)
  }

  const handleCancelField = () => {
    setEditedRows(selectedTemplate.rows)
    setEditingField(null)
  }

  const isFieldEditing = (rowId: string, field: string) => {
    return editingField?.rowId === rowId && editingField?.field === field
  }

  const handleSaveTable = (content: string) => {
    setTableContent(content)
  }

  const isPharmacologyTableSection =
    ["2.6.3", "2.6.5", "2.6.7"].some((id) => section.number.includes(id)) || section.subsections?.some((sub) => ["2.6.3", "2.6.5", "2.6.7"].some((id) => sub.subsectionNumber.includes(id)))

  const [rowRequirements, setRowRequirements] = useState<Record<string, string>>(
    Object.fromEntries(selectedTemplate.rows.map((row) => [row.id, row.indRequirement || "Mandatory"])),
  )

  const handleRequirementChange = (rowId: string, value: string) => {
    setRowRequirements((prev) => ({ ...prev, [rowId]: value }))
  }

  const handleRevert = () => {
    const defaultTemplate = mockTemplates.find((t) => t.isDefault)
    if (defaultTemplate) {
      setEditedRows(defaultTemplate.rows)
      setRowRequirements(
        Object.fromEntries(defaultTemplate.rows.map((row) => [row.id, row.indRequirement || "Mandatory"])),
      )
    }
    setShowRevertConfirm(false)
  }

  const handleTableRevert = () => {
    setTableContent(default_table)
    setShowTableRevertConfirm(false)
  }

  const getRequirementColor = (requirement: string) => {
    switch (requirement) {
      case "Mandatory":
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
            {mockTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate.id === template.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleTemplateChange(template)}
                className="gap-2"
              >
                {template.name}
                {template.isDefault && (
                  <Badge variant="secondary" className="ml-1">
                    Default
                  </Badge>
                )}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowRevertConfirm(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Revert to Default
            </Button>
          </div>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {!isPharmacologyTableSection &&
                editedRows.map((row, index) => (
                  <div key={row.id} className="border rounded-lg p-6 bg-card space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-muted-foreground font-medium">Section</label>
                        <div className="mt-1">{row.section}</div>
                      </div>
                      <div>
                        <label className="text-muted-foreground font-medium">Subsection</label>
                        <div className="mt-1">{row.subsection}</div>
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
                        <label className="text-muted-foreground font-medium">Section Element</label>
                        <div className="mt-1">
                          <div>{row.subSectionNumbering}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-muted-foreground font-medium text-sm">Content</label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={rowRequirements[row.id] || "Mandatory"}
                            onValueChange={(value) => handleRequirementChange(row.id, value)}
                          >
                            <SelectTrigger
                              className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[row.id] || "Mandatory")}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mandatory" className="text-red-600">
                                Mandatory
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
                      {isFieldEditing(row.id, "content") ? (
                        <textarea
                          value={row.content}
                          onChange={(e) =>
                            setEditedRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, content: e.target.value } : r)),
                            )
                          }
                          className="w-full mt-2 min-h-[100px] p-3 border border-border rounded-md bg-background resize-y"
                        />
                      ) : (
                        <div className="mt-1 p-3 bg-muted/30 rounded text-sm">{row.content}</div>
                      )}
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
                              value={rowRequirements[`${row.id}-sm`] || "Mandatory"}
                              onValueChange={(value) => handleRequirementChange(`${row.id}-sm`, value)}
                            >
                              <SelectTrigger
                                className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-sm`] || "Mandatory")}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mandatory" className="text-red-600">
                                  Mandatory
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
                        {isFieldEditing(row.id, "sm") ? (
                          <textarea
                            value={row.modalities.sm}
                            onChange={(e) => handleModalityEdit(row.id, "sm", e.target.value)}
                            className="w-full mt-2 min-h-[120px] p-3 border border-border rounded-md bg-background resize-y"
                            placeholder="Enter small molecule specific content..."
                          />
                        ) : (
                          <div className="mt-2 p-3 bg-blue-50/50 rounded-md text-sm">{row.modalities.sm}</div>
                        )}
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
                              value={rowRequirements[`${row.id}-bio`] || "Mandatory"}
                              onValueChange={(value) => handleRequirementChange(`${row.id}-bio`, value)}
                            >
                              <SelectTrigger
                                className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-bio`] || "Mandatory")}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mandatory" className="text-red-600">
                                  Mandatory
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
                        {isFieldEditing(row.id, "bio") ? (
                          <textarea
                            value={row.modalities.bio}
                            onChange={(e) => handleModalityEdit(row.id, "bio", e.target.value)}
                            className="w-full mt-2 min-h-[120px] p-3 border border-border rounded-md bg-background resize-y"
                            placeholder="Enter biologics specific content..."
                          />
                        ) : (
                          <div className="mt-2 p-3 bg-green-50/50 rounded-md text-sm">{row.modalities.bio}</div>
                        )}
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
                              value={rowRequirements[`${row.id}-adc`] || "Mandatory"}
                              onValueChange={(value) => handleRequirementChange(`${row.id}-adc`, value)}
                            >
                              <SelectTrigger
                                className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-adc`] || "Mandatory")}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mandatory" className="text-red-600">
                                  Mandatory
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
                        {isFieldEditing(row.id, "adc") ? (
                          <textarea
                            value={row.modalities.adc}
                            onChange={(e) => handleModalityEdit(row.id, "adc", e.target.value)}
                            className="w-full mt-2 min-h-[120px] p-3 border border-border rounded-md bg-background resize-y"
                            placeholder="Enter ADC specific content..."
                          />
                        ) : (
                          <div className="mt-2 p-3 bg-purple-50/50 rounded-md text-sm">{row.modalities.adc}</div>
                        )}
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
                              value={rowRequirements[`${row.id}-ont`] || "Mandatory"}
                              onValueChange={(value) => handleRequirementChange(`${row.id}-ont`, value)}
                            >
                              <SelectTrigger
                                className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-ont`] || "Mandatory")}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mandatory" className="text-red-600">
                                  Mandatory
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
                        {isFieldEditing(row.id, "ont") ? (
                          <textarea
                            value={row.modalities.ont}
                            onChange={(e) => handleModalityEdit(row.id, "ont", e.target.value)}
                            className="w-full mt-2 min-h-[120px] p-3 border border-border rounded-md bg-background resize-y"
                            placeholder="Enter oligonucleotide specific content..."
                          />
                        ) : (
                          <div className="mt-2 p-3 bg-orange-50/50 rounded-md text-sm">{row.modalities.ont}</div>
                        )}
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
                              value={rowRequirements[`${row.id}-other`] || "Mandatory"}
                              onValueChange={(value) => handleRequirementChange(`${row.id}-other`, value)}
                            >
                              <SelectTrigger
                                className={`w-[160px] h-7 text-xs ${getRequirementColor(rowRequirements[`${row.id}-other`] || "Mandatory")}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mandatory" className="text-red-600">
                                  Mandatory
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
                        {isFieldEditing(row.id, "other") ? (
                          <textarea
                            value={row.modalities.other}
                            onChange={(e) => handleModalityEdit(row.id, "other", e.target.value)}
                            className="w-full mt-2 min-h-[120px] p-3 border border-border rounded-md bg-background resize-y"
                            placeholder="Enter other modality specific content..."
                          />
                        ) : (
                          <div className="mt-2 p-3 bg-pink-50/50 rounded-md text-sm">{row.modalities.other}</div>
                        )}
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
                      You can customize this template by clicking the "Edit Table" button to add or remove rows and
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
