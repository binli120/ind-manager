// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface Module {
  id: number
  name: string
  progress: number
  issues: number
  sections: number
}

interface SectionHeatmapProps {
  modules: Module[]
}

// Generate mock section data
const generateSectionData = (moduleId: number, sectionCount: number) => {
  return Array.from({ length: sectionCount }, (_, i) => {
    const rand = Math.random()
    let status = "complete"
    if (rand < 0.1) status = "missing"
    else if (rand < 0.25) status = "critical"
    else if (rand < 0.4) status = "warning"

    return {
      id: `${moduleId}-${i + 1}`,
      name: `Section ${moduleId}.${i + 1}`,
      status,
      assignee: ["Dr. Smith", "Dr. Johnson", "Dr. Williams", "Dr. Brown"][Math.floor(Math.random() * 4)],
      details:
        status === "missing"
          ? "Required documentation not uploaded"
          : status === "critical"
            ? "Critical information missing or inconsistent"
            : status === "warning"
              ? "Recommended improvements needed"
              : "All requirements met",
    }
  })
}

export function SectionHeatmap({ modules }: SectionHeatmapProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const modulesSections = modules.map((module) => ({
    module,
    sections: generateSectionData(module.id, module.sections),
  }))

  const getColorClass = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-success hover:bg-success/80"
      case "warning":
        return "bg-warning hover:bg-warning/80"
      case "critical":
        return "bg-error hover:bg-error/80"
      case "missing":
        return "bg-muted hover:bg-muted/80"
      default:
        return "bg-muted"
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="space-y-6">
          {modulesSections.map(({ module, sections }) => (
            <div key={module.id} className="space-y-2">
              {/* Module header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Module {module.id}: {module.name}
                </h4>
                <span className="text-xs text-muted-foreground">{sections.length} sections</span>
              </div>

              {/* Module sections grid */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="grid grid-cols-10 gap-2">
                  {sections.map((section) => (
                    <Tooltip key={section.id} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "aspect-square rounded cursor-pointer transition-all",
                            getColorClass(section.status),
                            selectedSection === section.id && "ring-2 ring-primary ring-offset-2",
                          )}
                          onClick={() => setSelectedSection(section.id)}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <div className="space-y-1">
                          <p className="font-semibold">{section.name}</p>
                          <p className="text-sm text-muted-foreground">Assignee: {section.assignee}</p>
                          <p className="text-sm">{section.details}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success" />
            <span className="text-sm">Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning" />
            <span className="text-sm">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-error" />
            <span className="text-sm">Critical Issues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm">Missing</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
