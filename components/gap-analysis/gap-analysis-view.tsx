'use client';

import React from 'react';

interface GapAnalysisViewProps {
  className?: string;
}

/**
 * GapAnalysisView Component
 * 
 * A React wrapper component that embeds the gap analysis HTML interface
 * using an iframe. This allows the standalone HTML validation tool to be
 * integrated into the Next.js application while maintaining its functionality.
 * 
 * Features:
 * - Document completeness validation
 * - Template-based rule checking
 * - Interactive alerts and remediation
 * - Dual-view interface (Report View and Editor View)
 */
export function GapAnalysisView({ className = '' }: GapAnalysisViewProps) {
  return (
    <div className={`gap-analysis-container ${className}`}>
      <iframe
        src="/gap-analysis.html"
        title="Gap Analysis Completeness Check"
        className="w-full h-full border-0"
        style={{ minHeight: '100vh' }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
