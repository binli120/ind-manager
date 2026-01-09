"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


interface DataPreparationGaugeProps {
  completionPercentage: number
}

export function DataPreparationGauge({ completionPercentage }: DataPreparationGaugeProps) {
  //add safe calculation
  const safePercentage = Number.isFinite(completionPercentage)
    ? Math.min(100, Math.max(0, completionPercentage))
    : 0
  // Calculate gauge angle (180 degrees = 0%, 0 degrees = 100%)
  const angle = 180 - (safePercentage / 100) * 180
  // Color based on completion thresholds
  const getColor = (percentage: number) => {
    if (percentage === 100) return "hsl(var(--success))"
    if (percentage >= 85) return "hsl(var(--success))"
    if (percentage >= 60) return "hsl(var(--warning))"
    return "hsl(var(--destructive))"
  }

  const color = getColor(safePercentage)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Data Preparation</CardTitle>
        <CardDescription>Overall completion for IND submission readiness</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        {/* Gauge SVG */}
        <div className="relative w-64 h-32 mb-6">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 90 A 90 90 0 0 1 190 90"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 10 90 A 90 90 0 0 1 190 90"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(safePercentage/ 100) * 283} 283`}
              className="transition-all duration-1000 ease-out"
            />
            {/* Needle */}
            <g transform={`rotate(${angle} 100 90)`}>
              <line
                x1="100"
                y1="90"
                x2="100"
                y2="20"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="90" r="6" fill="hsl(var(--foreground))" />
            </g>
          </svg>

          {/* Percentage in center */}
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color }}>
                {safePercentage}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {safePercentage === 100
                  ? "Complete"
                  : safePercentage >= 85
                    ? "On Track"
                    : safePercentage >= 60
                      ? "At Risk"
                      : "Critical"}
              </div>
            </div>
          </div>
        </div>

        {/* Scale markers */}
        <div className="w-64 flex justify-between text-xs text-muted-foreground px-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        {/* Status indicator */}
        {safePercentage === 100 && (
          <div className="mt-6 flex items-center gap-2 text-success animate-pulse">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Ready for Submission</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
