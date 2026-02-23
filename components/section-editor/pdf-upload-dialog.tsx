// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { labelUploadedDocument, type LabelCandidate } from "@/lib/services/pdfLabel"
import { uploadDocumentToS3 } from "@/lib/services/pdfUpload"

interface PdfUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (sectionNumber: string, fileName: string) => void
  company?: string
  projectName?: string
}

export function PdfUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  company,
  projectName,
}: PdfUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLabeling, setIsLabeling] = useState(false)
  const [labelProgress, setLabelProgress] = useState(0)
  const [labelTimedOut, setLabelTimedOut] = useState(false)
  const [labelStarted, setLabelStarted] = useState(false)
  const [autoLabeledSection, setAutoLabeledSection] = useState("")
  const [sectionNumber, setSectionNumber] = useState("")
  const [candidates, setCandidates] = useState<LabelCandidate[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const labelTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const labelAbortRef = useRef<AbortController | null>(null)
  const [resultDialog, setResultDialog] = useState<{
    open: boolean
    success: boolean
    title: string
    message: string
  }>({ open: false, success: true, title: "", message: "" })

  const buildSectionFolder = (section: string) => {
    const parts = section.split(".").filter(Boolean)
    if (!parts.length) return ""
    const segments: string[] = []
    segments.push(`Module ${parts[0]}`)
    parts.forEach((_p, idx) => {
      const slice = parts.slice(0, idx + 1).join(".")
      segments.push(slice)
    })
    return segments.join("/")
  }

  const startLabeling = useCallback(async () => {
    if (!file) return
    if (isLabeling) return
    setIsLabeling(true)
    setLabelStarted(true)
    setLabelTimedOut(false)
    setLabelProgress(5)
    if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current)
    if (labelAbortRef.current) labelAbortRef.current.abort()
    const aborter = new AbortController()
    labelAbortRef.current = aborter
    labelTimeoutRef.current = setTimeout(() => {
      aborter.abort()
      setIsLabeling(false)
      setLabelTimedOut(true)
    }, 30000)
    try {
      const ticker = setInterval(() => {
        setLabelProgress((p) => Math.min(95, p + 5))
      }, 400)
      const result = await labelUploadedDocument(file, { page_limit: 5, use_llm: false, signal: aborter.signal })
      clearInterval(ticker)
      setLabelProgress(100)
      setCandidates(result.candidates || [])
      const top = result.section_number || result.candidates?.[0]?.section_number
      if (top) {
        setAutoLabeledSection(top)
        setSectionNumber(top)
      }
    } catch (err) {
      console.error("label-upload failed", err)
      setLabelTimedOut(true)
    } finally {
      if (labelTimeoutRef.current) {
        clearTimeout(labelTimeoutRef.current)
        labelTimeoutRef.current = null
      }
      if (labelAbortRef.current === aborter) {
        labelAbortRef.current = null
      }
      setIsLabeling(false)
    }
  }, [file, isLabeling])

  const handleFileSelect = useCallback((selectedFile: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
      "text/markdown",
    ]
    if (allowedTypes.includes(selectedFile.type) || /\.(pdf|doc|docx|rtf|md)$/i.test(selectedFile.name)) {
      setFile(selectedFile)
      setUploadProgress(0)
      setLabelProgress(0)
      setLabelStarted(false)
      setLabelTimedOut(false)
      setIsUploading(false)
      setAutoLabeledSection("")
      setSectionNumber("")
      startLabeling()
    } else {
      alert("Please select a PDF, Word, RTF, or Markdown file")
    }
  }, [startLabeling])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect],
  )

  const handleUpload = async () => {
    if (!file) return
    if ((!labelStarted || !autoLabeledSection) && !labelTimedOut) {
      await startLabeling()
    }
    if (isLabeling) return
    setIsUploading(true)
    setUploadProgress(10)
    try {
      const folder = sectionNumber ? buildSectionFolder(sectionNumber) : undefined
      console.log("[upload] start", { sectionNumber, folder, company, projectName })
      const resp = await uploadDocumentToS3(
        file,
        {
          company: company || "unknown-company",
          project: projectName || "unknown-project",
          folder,
          wait_for_completion: true,
        },
        undefined,
      )
      setUploadProgress(100)
      setResultDialog({
        open: true,
        success: true,
        title: "Upload complete",
        message: `File ${file.name} ${
          (resp as { version_id?: string; versionId?: string; version?: string }).version_id ??
          (resp as { versionId?: string }).versionId ??
          (resp as { version?: string }).version ??
          ""
        } stored at ${folder ?? "root"}`,
      })
      onOpenChange(false)
    } catch (err) {
      console.error("[upload] failed", err)
      setUploadProgress(0)
      setResultDialog({
        open: true,
        success: false,
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirm = () => {
    if (sectionNumber && file) {
      if (uploadProgress < 100) {
        // If user skips explicit upload button, still simulate quickly
        setUploadProgress(100)
      }
      onUploadComplete(sectionNumber, file.name)
      handleClose()
    }
  }

  const handleClose = () => {
    setFile(null)
    setIsUploading(false)
    setUploadProgress(0)
    setLabelTimedOut(false)
    setLabelStarted(false)
    setCandidates([])
    if (labelAbortRef.current) {
      labelAbortRef.current.abort()
      labelAbortRef.current = null
    }
    if (labelTimeoutRef.current) {
      clearTimeout(labelTimeoutRef.current)
      labelTimeoutRef.current = null
    }
    setAutoLabeledSection("")
    setSectionNumber("")
    onOpenChange(false)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadProgress(0)
    setLabelProgress(0)
    setLabelTimedOut(false)
    setLabelStarted(false)
    setCandidates([])
    if (labelAbortRef.current) {
      labelAbortRef.current.abort()
      labelAbortRef.current = null
    }
    if (labelTimeoutRef.current) {
      clearTimeout(labelTimeoutRef.current)
      labelTimeoutRef.current = null
    }
    setIsLabeling(false)
    setAutoLabeledSection("")
    setSectionNumber("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const canUpload = file && !isUploading && (!isLabeling || labelTimedOut)
  const uploadComplete = uploadProgress === 100 && !isUploading
  const pathPreview = sectionNumber
    ? (() => {
        const parts = sectionNumber.split(".").filter(Boolean)
        if (!parts.length) return ""
        const segments = []
        segments.push(`Module ${parts[0]}`)
        parts.forEach((_p, idx) => {
          const slice = parts.slice(0, idx + 1).join(".")
          segments.push(slice)
        })
        return segments.join("/")
      })()
    : ""

  const SECTION_OPTIONS = Array.from(
    new Set([
      "1.0",
      "2.1",
      "2.2",
      "2.3",
      "2.3.S",
      "2.3.P",
      "2.4",
      "2.4.1",
      "2.4.1.1",
      "2.5",
      "2.6",
      "3",
      ...candidates.map((c) => c.section_number).filter(Boolean),
    ]),
  )

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : file
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isUploading && uploadProgress === 0 && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Drop a document here or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports PDF, Word, RTF, and Markdown up to 50MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.md"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </>
            )}
          </div>

          {/* Upload Button */}
          {file && !uploadComplete && (
            <Button onClick={startLabeling} disabled={!canUpload || isUploading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {isLabeling ? "Auto Labeling..." : "Auto Label"}
            </Button>
          )}

          {/* Progress Bar Section */}
          {file && (
            <div className="space-y-4">
              {(isLabeling || labelProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Relabeling (suggesting IND section){labelTimedOut ? " — timed out, please pick manually" : ""}
                    </span>
                    <span className="font-medium">{labelProgress}%</span>
                  </div>
                  <Progress value={labelProgress} className="h-2" />
                </div>
              )}

              {(isUploading || uploadProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Upload to S3</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Section Number Input */}
              <div className="space-y-2">
                <Label htmlFor="section-number">IND Section No.</Label>
                <Select
                  value={sectionNumber || (autoLabeledSection ? autoLabeledSection : undefined)}
                  onValueChange={(v) => setSectionNumber(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={autoLabeledSection ? `Suggested: ${autoLabeledSection}` : "Pick a section"} />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="section-number"
                  value={sectionNumber}
                  onChange={(e) => setSectionNumber(e.target.value)}
                  placeholder={isUploading && !autoLabeledSection ? "Auto-labeling..." : "e.g., 2.4.1.1"}
                />
                {candidates.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Candidates:&nbsp;
                    {candidates.slice(0, 5).map((c, idx) => (
                      <span key={`${c.section_number}-${idx}`} className="mr-2">
                        {c.section_number}
                        {c.section_title ? ` (${c.section_title})` : ""}
                        {typeof c.score === "number" ? ` • ${Math.round(c.score * 100)}%` : ""}
                      </span>
                    ))}
                  </div>
                )}
                {autoLabeledSection && uploadComplete && (
                  <p className="text-xs text-muted-foreground">
                    AI suggested section: <span className="font-medium text-foreground">{autoLabeledSection}</span>
                  </p>
                )}
                {sectionNumber && (
                  <p className="text-xs text-muted-foreground">
                    Target S3 path preview: <span className="font-medium text-foreground">{pathPreview}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {file && (
            <Button onClick={handleUpload} disabled={!canUpload} variant="secondary">
              {isUploading ? "Uploading..." : "Upload to server"}
            </Button>
          )}
          <Button onClick={handleConfirm} disabled={!sectionNumber || !file || isLabeling}>
            OK
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      <Dialog open={resultDialog.open} onOpenChange={(v) => setResultDialog((prev) => ({ ...prev, open: v }))}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{resultDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className={resultDialog.success ? "text-sm text-foreground" : "text-sm text-destructive"}>
              {resultDialog.message}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setResultDialog((prev) => ({ ...prev, open: false }))}>Dismiss</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
