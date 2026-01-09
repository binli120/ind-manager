// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Folder, FolderOpen, Upload, FileText, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Section, SubsectionContent } from "@/types/section"
import { useState } from "react"

interface SidebarProps {
  sections: Section[]
  selectedSection: Section
  selectedSubsection: SubsectionContent | null
  onSelectSection: (section: Section) => void
  onSelectSubsection: (subsection: SubsectionContent) => void
  onUploadPdf: () => void // Added prop for PDF upload handler
  onReorderSubsections?: (draggedId: string, targetId: string, parentId: string | null) => void // Added prop for reorder handler
}

export function Sidebar({
  sections,
  selectedSection,
  selectedSubsection,
  onSelectSection,
  onSelectSubsection,
  onUploadPdf,
  onReorderSubsections,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([selectedSection.id]))
  const [draggedItem, setDraggedItem] = useState<{ id: string; parentId: string | null } | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const getStatusColor = (status: Section["status"]) => {
    switch (status) {
      case "approved":
        return "text-emerald-600 dark:text-emerald-400"
      case "in-review":
        return "text-amber-600 dark:text-amber-400"
      case "draft":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-muted-foreground"
    }
  }

  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, subsection: SubsectionContent, parentId: string | null) => {
    setDraggedItem({ id: subsection.id, parentId })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, subsectionId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItem(subsectionId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetSubsection: SubsectionContent, targetParentId: string | null) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedItem || draggedItem.id === targetSubsection.id) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    // Only allow reordering within the same parent
    if (draggedItem.parentId !== targetParentId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    // Call parent component to handle the reordering
    if (onReorderSubsections) {
      onReorderSubsections(draggedItem.id, targetSubsection.id, targetParentId)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const renderSubsections = (subsections: SubsectionContent[], depth = 1, parentId: string | null = null) => {
    return subsections.map((subsection) => (
      <div key={subsection.id}>
        <Button
          variant={selectedSubsection?.id === subsection.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-left h-auto py-2 px-3 transition-colors group",
            selectedSubsection?.id === subsection.id && "bg-secondary",
            dragOverItem === subsection.id && "border-t-2 border-blue-500",
            draggedItem?.id === subsection.id && "opacity-50",
          )}
          draggable={!subsection.isCategory}
          onDragStart={(e) => handleDragStart(e, subsection, parentId)}
          onDragOver={(e) => handleDragOver(e, subsection.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, subsection, parentId)}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            e.stopPropagation()
            onSelectSubsection(subsection)
            if (subsection.isCategory && subsection.subsections) {
              toggleExpanded(subsection.id)
            }
            if (!subsection.isCategory) {
              setTimeout(() => {
                const element = document.getElementById(`section-${subsection.subsectionNumber}`)
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              }, 100)
            }
          }}
        >
          <div className="flex items-start gap-2 w-full">
            {!subsection.isCategory && (
              <GripVertical className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            )}
            {subsection.isCategory && subsection.subsections ? (
              expandedSections.has(subsection.id) ? (
                <FolderOpen className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", getStatusColor(subsection.status))} />
              ) : (
                <Folder className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", getStatusColor(subsection.status))} />
              )
            ) : (
              <FileText className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", getStatusColor(subsection.status))} />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-foreground">{subsection.subsectionNumber}</div>
              {subsection.title && subsection.isCategory && (
                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{subsection.title}</div>
              )}
            </div>
          </div>
        </Button>

        {subsection.isCategory && subsection.subsections && expandedSections.has(subsection.id) && (
          <div className="ml-6 mt-1 space-y-1">
            {renderSubsections(subsection.subsections, depth + 1, subsection.id)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col" data-tour="sidebar">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">IND Section Editor</h1>
        <p className="text-sm text-muted-foreground mt-1">Regulatory AI Assistant</p>
        <Button variant="default" size="sm" className="w-full mt-4 gap-2" onClick={onUploadPdf}>
          <Upload className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">IND Sections</h2>
          <nav className="space-y-1" data-tour="section-tree">
            {sections.map((section) => (
              <div key={section.id}>
                <Button
                  variant={selectedSection.id === section.id && !selectedSubsection ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left h-auto py-3 px-3",
                    selectedSection.id === section.id && !selectedSubsection && "bg-secondary",
                  )}
                  onClick={() => {
                    if (section.isCategory && section.subsections) {
                      toggleExpanded(section.id)
                      if (section.subsections.length === 1) {
                        onSelectSubsection(section.subsections[0])
                      }
                    } else {
                      onSelectSection(section)
                    }
                  }}
                >
                  <div className="flex items-start gap-2 w-full">
                    {section.isCategory && section.subsections ? (
                      expandedSections.has(section.id) ? (
                        <FolderOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Folder className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )
                    ) : (
                      <Folder className={cn("h-4 w-4 mt-0.5 flex-shrink-0", getStatusColor(section.status))} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">{section.number}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{section.title}</div>
                    </div>
                  </div>
                </Button>

                {section.isCategory && section.subsections && expandedSections.has(section.id) && (
                  <div className="ml-6 mt-1 space-y-1">{renderSubsections(section.subsections, 1, section.id)}</div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}
