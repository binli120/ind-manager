"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Module {
  id: number
  name: string
}

interface AnalysisProgressProps {
  modules: Module[]
}

export function AnalysisProgress({ modules }: AnalysisProgressProps) {
  const [currentModule, setCurrentModule] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalModules = modules.length
    const timePerModule = 8000 / totalModules

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / totalModules / 10
        if (newProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        return newProgress
      })

      setCurrentModule((prev) => {
        const moduleIndex = Math.floor((progress / 100) * totalModules)
        return Math.min(moduleIndex, totalModules - 1)
      })
    }, timePerModule / 10)

    return () => clearInterval(interval)
  }, [modules.length, progress])

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Running Full Validation</h3>
            <span className="text-sm text-muted-foreground">{Math.floor(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="grid grid-cols-5 gap-3 mt-4">
            {modules.map((module, index) => {
              const isCompleted = index < currentModule
              const isActive = index === currentModule

              return (
                <div
                  key={module.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all",
                    isCompleted && "bg-success/10 border-success",
                    isActive && "bg-primary/10 border-primary animate-pulse",
                    !isCompleted && !isActive && "bg-muted/50 border-border",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">Module {module.id}</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
