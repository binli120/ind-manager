// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Calendar, User, Table, ImageIcon, Plus, Sparkles, ShoppingCart } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import type { MaterialItem, TableData, ImageData } from "./my-materials-dialog"

interface Material {
  id: string
  title: string
  type: string
  description: string
  content: string
  date: string
  author: string
  tags: string[]
  section: string
}

interface MaterialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: string
  subsectionId?: string
  subsectionTitle?: string
  onMaterialsCountChange?: (count: number) => void // Added callback for materials count
  materials: MaterialItem[]
  onMaterialsChange: (items: MaterialItem[]) => void
}

export function MaterialsDialog({
  open,
  onOpenChange,
  keyword,
  subsectionId = "2.6.1",
  subsectionTitle = "Nonclinical Overview",
  onMaterialsCountChange, // Accept the callback prop
  materials,
  onMaterialsChange,
}: MaterialsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null)
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)
  const selectableTextRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  const appendMaterial = (item: MaterialItem) => {
    const next = [...materials, item]
    onMaterialsChange(next)
    onMaterialsCountChange?.(next.length)
  }

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (open && keyword) {
      setSearchQuery(keyword)
    }
  }, [keyword, open])

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      console.log("[v0] Mouse up in materials dialog")
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      console.log("[v0] Selected text:", selectedText)
      console.log("[v0] Target element:", e.target)
      console.log("[v0] selectableTextRef contains target:", selectableTextRef.current?.contains(e.target as Node))

      if (selectedText && selectedText.length > 0 && selectableTextRef.current?.contains(e.target as Node)) {
        const range = selection?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()
        console.log("[v0] Selection rect:", rect)

        if (rect) {
          const menuWidth = 200
          const menuHeight = 100

          let menuX = rect.left + 10
          let menuY = rect.bottom + 10

          if (menuX + menuWidth > window.innerWidth) {
            menuX = window.innerWidth - menuWidth - 10
          }

          if (menuY + menuHeight > window.innerHeight) {
            menuY = rect.top - menuHeight - 10
          }

          console.log("[v0] Setting context menu at:", menuX, menuY)

          setContextMenu({
            x: menuX,
            y: menuY,
            text: selectedText,
          })
        }
      } else {
        setContextMenu(null)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !(e.target as HTMLElement).closest(".context-menu")) {
        setContextMenu(null)
      }
    }

    if (open) {
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu, open])

  const handleAddToMaterials = (text: string, type: MaterialItem["type"]) => {
    appendMaterial({ type, content: text, timestamp: new Date() })
    setContextMenu(null)
  }

  const handleSummarizeText = (text: string) => {
    const summary = `Summary: ${text.substring(0, 100)}...`
    appendMaterial({ type: "summary", content: summary, originalText: text, timestamp: new Date() })
    setContextMenu(null)
  }

  const toggleTableSelection = (tableId: string, tableData: TableData) => {
    const newSelection = new Set(selectedTables)
    if (newSelection.has(tableId)) {
      newSelection.delete(tableId)
      const next = materials.filter((m) => m.id !== tableId)
      onMaterialsChange(next)
      onMaterialsCountChange?.(next.length)
    } else {
      newSelection.add(tableId)
      appendMaterial({ type: "table", id: tableId, data: tableData, timestamp: new Date() })
    }
    setSelectedTables(newSelection)
    console.log("[v0] Toggled table selection:", tableId)
  }

  const toggleImageSelection = (imageId: string, imageData: ImageData) => {
    const newSelection = new Set(selectedImages)
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId)
      const next = materials.filter((m) => m.id !== imageId)
      onMaterialsChange(next)
      onMaterialsCountChange?.(next.length)
    } else {
      newSelection.add(imageId)
      appendMaterial({ type: "image", id: imageId, data: imageData, timestamp: new Date() })
    }
    setSelectedImages(newSelection)
    console.log("[v0] Toggled image selection:", imageId)
  }

  const availableMaterials: Material[] = [
    {
      id: "1",
      title: "Nonclinical Study Design Guidelines",
      type: "Guideline",
      section: "2.6.1.1",
      description: "Comprehensive guidelines for designing nonclinical studies",
      content: `# Nonclinical Study Design Guidelines

## Overview
This document provides comprehensive guidelines for designing nonclinical studies including pharmacology, pharmacokinetics, and toxicology assessments.

## Key Requirements
1. Primary Pharmacology Studies
   - In vitro target binding assays
   - Functional activity assays
   - Selectivity profiling

2. Secondary Pharmacology
   - Off-target screening
   - Safety pharmacology core battery
   
3. Pharmacokinetics
   - Dose-proportional exposure
   - Bioavailability assessment
   - Tissue distribution studies

## Study Design Considerations
When designing nonclinical studies, consider the following factors:
- Route of administration
- Dose selection rationale
- Study duration
- Species selection
- Sample size calculations`,
      date: "2024-01-15",
      author: "FDA",
      tags: ["Nonclinical", "Study Design", "FDA Guidelines"],
    },
    {
      id: "2",
      title: "XYZ-123 Pharmacology Study Report",
      type: "Study Report",
      section: "2.6.1.2",
      description: "Detailed pharmacology study results for XYZ-123",
      content: `# XYZ-123 Pharmacology Study Report

## Executive Summary
This report presents the pharmacology study results for XYZ-123, a novel kinase inhibitor.

## Primary Pharmacology
XYZ-123 demonstrated potent and selective inhibition of the target kinase with an IC50 of 2.3 nM in biochemical assays.

### In Vitro Studies
- Target binding: Kd = 1.8 nM
- Functional activity: IC50 = 2.3 nM
- Selectivity ratio: >100-fold vs off-targets

### In Vivo Studies
- Tumor growth inhibition at 10 mg/kg
- Biomarker modulation observed
- Well-tolerated in efficacy studies

## Secondary Pharmacology
No significant off-target activity at concentrations up to 100-fold above the primary target IC50.`,
      date: "2024-02-20",
      author: "Research Team",
      tags: ["Pharmacology", "XYZ-123", "Study Report"],
    },
    {
      id: "3",
      title: "Small Molecule Kinase Inhibitor Template",
      type: "Template",
      section: "2.6.1.3",
      description: "Standard template for kinase inhibitor programs",
      content: `# Small Molecule Kinase Inhibitor Template

## Section 2.4.1: Nonclinical Overview

### Introduction
[Provide background on the therapeutic target and disease indication]

### Drug Candidate Profile
- Chemical name: [Insert]
- Molecular weight: [Insert]
- Mechanism of action: [Insert]

### Nonclinical Development Strategy
The nonclinical program encompasses:
1. Primary pharmacology studies
2. Secondary pharmacology assessments
3. Safety pharmacology studies
4. PK/ADME characterization
5. Toxicology evaluation

### Key Findings
[Summarize major findings from nonclinical studies]`,
      date: "2024-03-10",
      author: "Regulatory Team",
      tags: ["Template", "Small Molecule", "Kinase Inhibitor"],
    },
    {
      id: "4",
      title: "ICH S6 Guideline: Preclinical Safety Evaluation",
      type: "Regulatory Guideline",
      section: "2.6.1.4",
      description: "ICH guidelines for biologics safety evaluation",
      content: `# ICH S6(R1) Guideline

## Preclinical Safety Evaluation of Biotechnology-Derived Pharmaceuticals

### Scope
This guideline applies to biotechnology-derived pharmaceuticals including:
- Proteins and peptides
- Oligonucleotides
- Gene therapy products

### General Principles
1. Case-by-case approach
2. Relevant species selection
3. Tissue cross-reactivity studies
4. Immunogenicity assessment`,
      date: "2023-12-01",
      author: "ICH",
      tags: ["ICH", "Guidelines", "Biologics"],
    },
  ]

  const filteredMaterials = availableMaterials.filter((material) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      material.title.toLowerCase().includes(query) ||
      material.description.toLowerCase().includes(query) ||
      material.content.toLowerCase().includes(query) ||
      material.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  const selectedFile = selectedFileId ? availableMaterials.find((m) => m.id === selectedFileId) : filteredMaterials[0]

  const mockTables: TableData[] = [
    {
      id: "table1",
      title: "Table 1: Pharmacodynamic Parameters",
      headers: ["Parameter", "Value", "Units", "Method"],
      rows: [
        ["IC50", "2.3", "nM", "Biochemical assay"],
        ["Kd", "1.8", "nM", "Surface plasmon resonance"],
        ["Ki", "1.2", "nM", "Competitive binding"],
      ],
    },
    {
      id: "table2",
      title: "Table 2: In Vivo Efficacy Results",
      headers: ["Dose (mg/kg)", "Tumor Growth Inhibition (%)", "P-value"],
      rows: [
        ["1", "35", "0.05"],
        ["5", "68", "0.001"],
        ["10", "89", "< 0.0001"],
      ],
    },
    {
      id: "table3",
      title: "Table 3: Safety Pharmacology Core Battery",
      headers: ["System", "Test", "Result", "Conclusion"],
      rows: [
        ["Cardiovascular", "hERG inhibition", "IC50 > 30 μM", "Low risk"],
        ["CNS", "Irwin test", "No effects at 100 mg/kg", "Well tolerated"],
        ["Respiratory", "Plethysmography", "No effects", "Safe"],
      ],
    },
  ]

  const mockImages: ImageData[] = [
    {
      id: "img1",
      title: "Figure 1: Dose-Response Curve",
      url: "/dose-response-curve-graph.jpg",
      caption: "Dose-response curve showing IC50 determination",
    },
    {
      id: "img2",
      title: "Figure 2: Tumor Growth Inhibition",
      url: "/tumor-growth-inhibition-chart.jpg",
      caption: "Tumor volume over time in treatment vs control groups",
    },
    {
      id: "img3",
      title: "Figure 3: Pharmacokinetic Profile",
      url: "/pharmacokinetic-profile-line-graph.jpg",
      caption: "Plasma concentration-time profile following single dose",
    },
    {
      id: "img4",
      title: "Figure 4: Target Engagement",
      url: "/target-engagement-biomarker-graph.jpg",
      caption: "Biomarker modulation demonstrating target engagement",
    },
  ]

  useEffect(() => {
    if (onMaterialsCountChange) {
      onMaterialsCountChange(materials.length)
    }
  }, [materials, onMaterialsCountChange])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="p-6"
          style={{ width: "95vw", maxWidth: "95vw", height: "90vh", maxHeight: "90vh" }}
          ref={contentRef}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {subsectionId} {subsectionTitle} - Materials
              </DialogTitle>
            <Button variant="outline" size="sm" className="bg-transparent mr-12">
              <ShoppingCart className="h-4 w-4 mr-2" />
              My Materials ({materials.length})
            </Button>
            </div>
          </DialogHeader>

          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-6" style={{ height: "calc(90vh - 180px)" }}>
            <div className="w-[450px] min-w-[450px] flex-shrink-0 border-r border-border pr-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {filteredMaterials.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No materials found</p>
                  ) : (
                    filteredMaterials.map((material) => (
                      <button
                        key={material.id}
                        onClick={() => setSelectedFileId(material.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedFile?.id === material.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm leading-snug">{material.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{material.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {material.type}
                          </Badge>
                          <span>{material.section}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(material.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {material.author}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              {selectedFile ? (
                <Tabs defaultValue="text" className="h-full flex flex-col">
                  <TabsList className="mb-4">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="tables" className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      Tables
                    </TabsTrigger>
                    <TabsTrigger value="images" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Images
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="mt-4 space-y-4">
                    {selectedFile && (
                      <>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">{selectedFile.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {selectedFile.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {selectedFile.author}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedFile.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <ScrollArea className="h-[calc(90vh-280px)]">
                          <div
                            ref={selectableTextRef}
                            className="whitespace-pre-wrap text-sm leading-relaxed select-text"
                          >
                            {selectedFile.content}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="tables" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-6 pr-2">
                        {mockTables.map((table, idx) => {
                          const tableId = table.id ?? `table-${idx}`
                          return (
                            <div key={tableId} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">{table.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedTables.has(tableId)}
                                    onCheckedChange={() => toggleTableSelection(tableId, table)}
                                    id={`table-${tableId}`}
                                  />
                                  <label htmlFor={`table-${tableId}`} className="text-sm font-medium cursor-pointer">
                                    Add to materials
                                  </label>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b bg-muted/50">
                                      {(table.headers ?? []).map((header, idxHeader) => (
                                        <th key={idxHeader} className="px-4 py-2 text-left text-sm font-semibold">
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(table.rows ?? []).map((row, rowIdx) => (
                                      <tr key={rowIdx} className="border-b last:border-0 hover:bg-muted/30">
                                        {row.map((cell, cellIdx) => (
                                          <td key={cellIdx} className="px-4 py-2 text-sm">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="images" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-2 gap-4 pr-2">
                        {mockImages.map((image, idx) => {
                          const imageId = image.id ?? `img-${idx}`
                          return (
                            <div key={imageId} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm flex-1">{image.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={imageId}
                                    checked={selectedImages.has(imageId)}
                                    onCheckedChange={() => toggleImageSelection(imageId, image)}
                                  />
                                  <label htmlFor={imageId} className="text-xs text-muted-foreground cursor-pointer">
                                    Add
                                  </label>
                                </div>
                              </div>
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt={image.title || "Selected image"}
                                width={480}
                                height={320}
                                className="w-full h-auto rounded border bg-muted"
                              />
                              <p className="text-xs text-muted-foreground">{image.caption}</p>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a file to preview
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isMounted &&
        contextMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="context-menu fixed bg-white dark:bg-gray-800 border-4 border-red-500 rounded-lg shadow-2xl p-2 min-w-[200px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              zIndex: 999999,
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              console.log("[v0] Context menu clicked")
              e.stopPropagation()
            }}
          >
            <div className="text-xs text-gray-500 mb-2 p-1 bg-yellow-100">
              Debug: Menu at ({Math.round(contextMenu.x)}, {Math.round(contextMenu.y)})
            </div>
            <button
              onClick={() => {
                console.log("[v0] Add to materials clicked")
                handleAddToMaterials(contextMenu.text, "text")
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to my materials
            </button>
            <button
              onClick={() => {
                console.log("[v0] Generate summary clicked")
                handleSummarizeText(contextMenu.text)
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate summary
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
