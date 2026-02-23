// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { CheckCircle2, Circle, Clock, Trophy } from "lucide-react"
import { memo } from "react"
import { cn } from "@/lib/utils"

interface Milestone {
  id: string
  name: string
  description: string
  status: "completed" | "current" | "upcoming"
  date?: string
  completionPercentage?: number
}

const defaultMilestones: Milestone[] = [
  {
    id: "pre-ind",
    name: "Pre-IND Meeting",
    description: "Initial consultation with FDA",
    status: "completed",
    date: "Oct 15, 2024",
    completionPercentage: 100,
  },
  {
    id: "preparation",
    name: "IND Preparation",
    description: "Document compilation & gap analysis",
    status: "current",
    date: "In Progress",
    completionPercentage: 61,
  },
  {
    id: "internal-review",
    name: "Internal Review",
    description: "Quality assurance & compliance check",
    status: "upcoming",
    date: "Feb 10, 2024",
  },
  {
    id: "submission",
    name: "IND Submission",
    description: "Submit to FDA via ESG",
    status: "upcoming",
    date: "Feb 15, 2024",
  },
  {
    id: "fda-review",
    name: "FDA Review",
    description: "30-day FDA safety review period",
    status: "upcoming",
    date: "Mar 16, 2024",
  },
  {
    id: "cta",
    name: "Clinical Trial Authorization",
    description: "Authorization to proceed with study",
    status: "upcoming",
    date: "Mar 17, 2024",
  },
]

interface SubmissionTimelineProps {
  milestones?: Milestone[]
  className?: string
}

function SubmissionTimelineComponent({ milestones = defaultMilestones, className }: SubmissionTimelineProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-start justify-between gap-4">
        {milestones.map((milestone, index) => {
          const isCompleted = milestone.status === "completed"
          const isCurrent = milestone.status === "current"
          const isLast = index === milestones.length - 1
          const isVictory = isCurrent && milestone.completionPercentage === 100

          return (
            <div key={milestone.id} className="flex-1 relative">
              {!isLast && (
                <div
                  className={cn(
                    "absolute top-5 left-[50%] w-full h-0.5 -z-10",
                    isCompleted ? "bg-success" : "bg-border",
                  )}
                />
              )}

              <div className="flex flex-col items-center text-center space-y-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-success border-success text-success-foreground",
                    isVictory && "bg-success border-success text-success-foreground animate-pulse",
                    isCurrent && !isVictory && "bg-chart-1 border-chart-1 text-white",
                    !isCompleted && !isCurrent && "bg-background border-border text-muted-foreground",
                  )}
                >
                  {isCompleted || isVictory ? (
                    isVictory ? (
                      <Trophy className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1 max-w-[140px]">
                  <div
                    className={cn(
                      "font-semibold text-sm leading-tight",
                      isCurrent && "text-chart-1",
                      isCompleted && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground",
                    )}
                  >
                    {milestone.name}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">{milestone.description}</div>
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isCurrent && "text-chart-1",
                      isCompleted && "text-success",
                      !isCompleted && !isCurrent && "text-muted-foreground",
                    )}
                  >
                    {milestone.date}
                  </div>

                  {isCurrent && milestone.completionPercentage !== undefined && (
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            milestone.completionPercentage === 100 && "bg-success animate-pulse",
                            milestone.completionPercentage >= 85 &&
                              milestone.completionPercentage < 100 &&
                              "bg-success",
                            milestone.completionPercentage >= 60 && milestone.completionPercentage < 85 && "bg-warning",
                            milestone.completionPercentage < 60 && "bg-destructive",
                          )}
                          style={{ width: `${milestone.completionPercentage}%` }}
                        />
                      </div>
                      <div
                        className={cn(
                          "text-xs font-semibold mt-1 flex items-center justify-center gap-1",
                          milestone.completionPercentage === 100 && "text-success",
                          milestone.completionPercentage >= 85 &&
                            milestone.completionPercentage < 100 &&
                            "text-success",
                          milestone.completionPercentage >= 60 && milestone.completionPercentage < 85 && "text-warning",
                          milestone.completionPercentage < 60 && "text-destructive",
                        )}
                      >
                        {milestone.completionPercentage === 100 && <Trophy className="w-3 h-3" />}
                        {milestone.completionPercentage}% Complete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const SubmissionTimeline = memo(SubmissionTimelineComponent)
SubmissionTimeline.displayName = "SubmissionTimeline"
