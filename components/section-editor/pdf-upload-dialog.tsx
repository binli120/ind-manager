"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface PdfUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (sectionNumber: string, fileName: string) => void
}

export function PdfUploadDialog({ open, onOpenChange, onUploadComplete }: PdfUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [autoLabeledSection, setAutoLabeledSection] = useState("")
  const [sectionNumber, setSectionNumber] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setUploadProgress(0)
      setAutoLabeledSection("")
      setSectionNumber("")
    } else {
      alert("Please select a PDF file")
    }
  }

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [])

  const simulateUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setUploadProgress(i)
    }

    // Simulate AI labeling API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockSectionNumber = "2.4.1.1"
    setAutoLabeledSection(mockSectionNumber)
    setSectionNumber(mockSectionNumber)
    setIsUploading(false)
  }

  const handleUpload = () => {
    if (file) {
      simulateUpload()
    }
  }

  const handleConfirm = () => {
    if (sectionNumber && file) {
      onUploadComplete(sectionNumber, file.name)
      handleClose()
    }
  }

  const handleClose = () => {
    setFile(null)
    setIsUploading(false)
    setUploadProgress(0)
    setAutoLabeledSection("")
    setSectionNumber("")
    onOpenChange(false)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadProgress(0)
    setAutoLabeledSection("")
    setSectionNumber("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const canUpload = file && !isUploading && uploadProgress === 0
  const uploadComplete = uploadProgress === 100 && !isUploading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload PDF Document</DialogTitle>
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
                <p className="text-sm font-medium mb-2">Drop PDF file here or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">Supports PDF files up to 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
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
            <Button onClick={handleUpload} disabled={!canUpload || isUploading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          )}

          {/* Progress Bar Section */}
          {(isUploading || uploadProgress > 0) && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                You can click OK button to close the dialog before uploading finishes, enter section number or we are
                going to auto-label it.
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Upload Progress</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>

              {/* Section Number Input */}
              <div className="space-y-2">
                <Label htmlFor="section-number">IND Section No.</Label>
                <Input
                  id="section-number"
                  value={sectionNumber}
                  onChange={(e) => setSectionNumber(e.target.value)}
                  placeholder={isUploading && !autoLabeledSection ? "Auto-labeling..." : "e.g., 2.4.1.1"}
                />
                {autoLabeledSection && uploadComplete && (
                  <p className="text-xs text-muted-foreground">
                    AI suggested section: <span className="font-medium text-foreground">{autoLabeledSection}</span>
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
          <Button onClick={handleConfirm} disabled={!sectionNumber || !file}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
