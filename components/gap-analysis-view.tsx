// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client";

import { memo } from "react";
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

function GapAnalysisViewComponent({}: GapAnalysisViewProps) {
  return <GapAnalysisDashboard />;
}

export const GapAnalysisView = memo(GapAnalysisViewComponent);
GapAnalysisView.displayName = "GapAnalysisView";
