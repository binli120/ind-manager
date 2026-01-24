import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GapAnalysisView } from "@/components/gap-analysis/gap-analysis-view"

/**
 * Gap Analysis Page
 * 
 * Protected route that provides access to the Gap Analysis Completeness Check tool.
 * Requires user authentication via Supabase.
 * 
 * Features:
 * - Document completeness validation against templates
 * - Interactive alerts and remediation guidance
 * - Dual-view interface (Report View and Editor View)
 * - Real-time validation feedback
 */
export default async function GapAnalysisPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 w-full h-screen">
      <GapAnalysisView />
    </div>
  )
}
