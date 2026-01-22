"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Module {
  id: number
  name: string
  progress: number
  issues: number
  sections: number
}

interface ModuleProgressChartProps {
  modules: Module[]
  onModuleClick: (id: number) => void
}

export function ModuleProgressChart({ modules, onModuleClick }: ModuleProgressChartProps) {
  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-success"
    if (progress >= 70) return "bg-chart-1"
    if (progress >= 50) return "bg-warning"
    return "bg-error"
  }

  return (
    <div className="space-y-6">
      {modules.map((module) => (
        <div
          key={module.id}
          className="group cursor-pointer hover:bg-accent/50 p-4 rounded-lg transition-colors"
          onClick={() => onModuleClick(module.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-medium">{module.name}</span>
              <Badge variant={module.issues === 0 ? "default" : "destructive"} className="ml-auto">
                {module.issues} {module.issues === 1 ? "issue" : "issues"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-lg font-bold min-w-[60px] text-right">{module.progress}%</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
          <div className="relative">
            <Progress value={module.progress} className="h-3" />
            <div
              className={cn("absolute top-0 left-0 h-3 rounded-full transition-all", getProgressColor(module.progress))}
              style={{ width: `${module.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{module.sections} sections</span>
            <span>Click for detailed breakdown</span>
          </div>
        </div>
      ))}
    </div>
  )
}
