"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, AlertTriangle, AlertCircle, Calendar, RefreshCw, Download, Package, ArrowLeft } from "lucide-react"

interface GapAnalysisViewProps {
  onViewChange?: (
    view:
      | "workspace"
      | "projects"
      | "calendar"
      | "submission"
      | "post-submission"
      | "gap-scoring"
      | "review-center"
      | "gap-analysis",
  ) => void
}

export function GapAnalysisView({ onViewChange }: GapAnalysisViewProps) {
  const modules = [
    { name: "Module 1", progress: 85, issues: 2, color: "bg-green-500" },
    { name: "Module 2", progress: 60, issues: 5, color: "bg-yellow-500" },
    { name: "Module 3", progress: 95, issues: 1, color: "bg-green-500" },
    { name: "Module 4", progress: 40, issues: 8, color: "bg-red-500" },
    { name: "Module 5", progress: 25, issues: 12, color: "bg-red-500" },
  ]

  const heatmapData = [
    [1, 2, 3, 4, 5, 6, 7, 8, 1, 2],
    [3, 4, 5, 1, 2, 3, 1, 2, 3, 1],
    [2, 3],
  ]

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-green-500" // Complete
      case 2:
        return "bg-yellow-500" // Warning
      case 3:
        return "bg-red-500" // Issues
      case 4:
        return "bg-gray-300" // Missing
      case 5:
        return "bg-green-500" // Complete
      default:
        return "bg-gray-300"
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange?.("workspace")}
              className="text-muted hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workspace
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Full Validation
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Package className="w-4 h-4 mr-2" />
              Compile eCTD Package
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AI Gap Analysis & Readiness Tracker</h1>
        </div>
        <p className="text-muted leading-relaxed">Identify gaps and track readiness for IND submission</p>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="max-w-7xl space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-medium text-muted">Overall Readiness</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">61%</div>
                  <p className="text-sm text-muted">28 issues remaining</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-medium text-muted">Critical Issues</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">2</div>
                  <p className="text-sm text-muted">Must fix before submission</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <h3 className="font-medium text-muted">Warnings</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">3</div>
                  <p className="text-sm text-muted">Recommended fixes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-muted">Days to Deadline</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">18</div>
                  <p className="text-sm text-muted">Target: Feb 15, 2024</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module Completion Progress */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Module Completion Progress</CardTitle>
                <p className="text-sm text-muted">Progress by eCTD module</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {modules.map((module) => (
                  <div key={module.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{module.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{module.progress}%</span>
                        <Badge variant="outline" className="text-xs">
                          {module.issues} issues
                        </Badge>
                      </div>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section Status Heatmap */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Section Status Heatmap</CardTitle>
                <p className="text-sm text-muted">Visual overview of section completeness</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {heatmapData.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((status, colIndex) => (
                        <div
                          key={colIndex}
                          className={`w-8 h-8 rounded ${getStatusColor(status)} flex items-center justify-center text-white text-xs font-medium`}
                        >
                          {colIndex + 1}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs text-muted">Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs text-muted">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs text-muted">Issues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span className="text-xs text-muted">Missing</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
