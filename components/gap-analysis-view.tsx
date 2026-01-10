"use client";

import GapAnalysisDashboard from "@/components/gap-analysis/gap-analysis-dashboard";

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
  ) => void;
}

export function GapAnalysisView({}: GapAnalysisViewProps) {
  return <GapAnalysisDashboard />;
}
