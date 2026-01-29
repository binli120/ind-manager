// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Download } from "lucide-react"
import { ModuleStatusCards } from "./module-status-cards"
import { RadialProgressChart } from "./radial-progress-chart"
import { RecentIssuesTable } from "./recent-issues-table"
import { AnalysisProgress } from "./analysis-progress"
import { IssueDetailDialog } from "./issue-detail-dialog"
import { SubmissionTimeline } from "./submission-timeline"

type SectionStatus = "complete" | "warning" | "missing" | "critical"
type Section = { id: string; name: string; status: SectionStatus; assignee: string }
type ModuleData = {
  id: number
  name: string
  progress: number
  issues: number
  sections: number
  totalSections: number
  complete: number
  warning: number
  missing: number
  sectionsDetail: Section[]
}

const projects = [
  { id: "ind-001", name: "IND-001: Oncology Phase I" },
  { id: "ind-002", name: "IND-002: Cardiology Phase II" },
  { id: "ind-003", name: "IND-003: Neurology Phase III" },
]

const mockData: {
  overallReadiness: number
  totalIssues: number
  criticalIssues: number
  warnings: number
  daysToDeadline: number
  targetDate: string
  modules: ModuleData[]
} = {
  overallReadiness: 61,
  totalIssues: 28,
  criticalIssues: 2,
  warnings: 3,
  daysToDeadline: 18,
  targetDate: "Feb 15, 2024",
  modules: [
    {
      id: 1,
      name: "Module 1: Administrative",
      progress: 85,
      issues: 2,
      sections: 12,
      totalSections: 12,
      complete: 10,
      warning: 1,
      missing: 1,
      sectionsDetail: [
        { id: "1.1", name: "Form FDA 1571", status: "complete", assignee: "John D." },
        { id: "1.2", name: "Form FDA 3674", status: "complete", assignee: "Sarah M." },
        { id: "1.3", name: "Cover Letter", status: "complete", assignee: "John D." },
        { id: "1.4", name: "Table of Contents", status: "complete", assignee: "Lisa K." },
        { id: "1.5", name: "Introductory Statement", status: "complete", assignee: "John D." },
        { id: "1.6", name: "General Investigational Plan", status: "complete", assignee: "Dr. Chen" },
        { id: "1.7", name: "Investigator Brochure", status: "complete", assignee: "Sarah M." },
        { id: "1.8", name: "Protocol", status: "complete", assignee: "Dr. Chen" },
        { id: "1.9", name: "Chemistry Manufacturing", status: "complete", assignee: "Mike R." },
        { id: "1.10", name: "Pharmacology/Toxicology", status: "warning", assignee: "Dr. Patel" },
        { id: "1.11", name: "Previous Human Experience", status: "complete", assignee: "Sarah M." },
        { id: "1.12", name: "Additional Information", status: "missing", assignee: "John D." },
      ],
    },
    {
      id: 2,
      name: "Module 2: CTD Summaries",
      progress: 60,
      issues: 5,
      sections: 18,
      totalSections: 18,
      complete: 11,
      warning: 3,
      missing: 4,
      sectionsDetail: [
        { id: "2.1", name: "CTD Table of Contents", status: "complete", assignee: "Lisa K." },
        { id: "2.2", name: "CTD Introduction", status: "complete", assignee: "John D." },
        { id: "2.3", name: "Quality Overall Summary", status: "complete", assignee: "Mike R." },
        { id: "2.4", name: "Nonclinical Overview", status: "warning", assignee: "Dr. Patel" },
        { id: "2.5", name: "Clinical Overview", status: "complete", assignee: "Dr. Chen" },
        { id: "2.6", name: "Nonclinical Summary", status: "critical", assignee: "Dr. Patel" },
        { id: "2.7", name: "Clinical Summary", status: "warning", assignee: "Dr. Chen" },
        { id: "2.8", name: "Pharmacology Written Summary", status: "complete", assignee: "Dr. Patel" },
        { id: "2.9", name: "Pharmacokinetics Summary", status: "complete", assignee: "Dr. Patel" },
        { id: "2.10", name: "Toxicology Summary", status: "warning", assignee: "Dr. Patel" },
        { id: "2.11", name: "Biopharmaceutics Summary", status: "complete", assignee: "Sarah M." },
        { id: "2.12", name: "Clinical Pharmacology", status: "complete", assignee: "Dr. Chen" },
        { id: "2.13", name: "Efficacy Summary", status: "complete", assignee: "Dr. Chen" },
        { id: "2.14", name: "Safety Summary", status: "missing", assignee: "Dr. Chen" },
        { id: "2.15", name: "Literature References", status: "complete", assignee: "Sarah M." },
        { id: "2.16", name: "Synopses", status: "complete", assignee: "Lisa K." },
        { id: "2.17", name: "Risk Management", status: "missing", assignee: "Dr. Chen" },
        { id: "2.18", name: "Benefit-Risk Analysis", status: "missing", assignee: "Dr. Chen" },
      ],
    },
    {
      id: 3,
      name: "Module 3: Quality",
      progress: 95,
      issues: 1,
      sections: 15,
      totalSections: 15,
      complete: 14,
      warning: 1,
      missing: 0,
      sectionsDetail: [
        { id: "3.1", name: "Drug Substance", status: "complete", assignee: "Mike R." },
        { id: "3.2", name: "Drug Product", status: "complete", assignee: "Mike R." },
        { id: "3.3", name: "Manufacturing Process", status: "complete", assignee: "Mike R." },
        { id: "3.4", name: "Control of Excipients", status: "complete", assignee: "Mike R." },
        { id: "3.5", name: "Control of Drug Product", status: "complete", assignee: "Mike R." },
        { id: "3.6", name: "Reference Standards", status: "complete", assignee: "Mike R." },
        { id: "3.7", name: "Container Closure System", status: "complete", assignee: "Mike R." },
        { id: "3.8", name: "Stability", status: "warning", assignee: "Mike R." },
        { id: "3.9", name: "Specifications", status: "complete", assignee: "Mike R." },
        { id: "3.10", name: "Analytical Procedures", status: "complete", assignee: "Mike R." },
        { id: "3.11", name: "Validation Reports", status: "complete", assignee: "Mike R." },
        { id: "3.12", name: "Batch Analyses", status: "complete", assignee: "Mike R." },
        { id: "3.13", name: "Characterization", status: "complete", assignee: "Mike R." },
        { id: "3.14", name: "Impurities", status: "complete", assignee: "Mike R." },
        { id: "3.15", name: "Regional Information", status: "complete", assignee: "Mike R." },
      ],
    },
    {
      id: 4,
      name: "Module 4: Nonclinical",
      progress: 40,
      issues: 8,
      sections: 22,
      totalSections: 22,
      complete: 9,
      warning: 5,
      missing: 8,
      sectionsDetail: [
        { id: "4.1", name: "Pharmacology Study Reports", status: "complete", assignee: "Dr. Patel" },
        { id: "4.2", name: "Primary Pharmacodynamics", status: "complete", assignee: "Dr. Patel" },
        { id: "4.3", name: "Secondary Pharmacodynamics", status: "warning", assignee: "Dr. Patel" },
        { id: "4.4", name: "Safety Pharmacology", status: "complete", assignee: "Dr. Patel" },
        { id: "4.5", name: "PD Drug Interactions", status: "critical", assignee: "Dr. Patel" },
        { id: "4.6", name: "Pharmacokinetics Studies", status: "complete", assignee: "Dr. Patel" },
        { id: "4.7", name: "Absorption Studies", status: "warning", assignee: "Dr. Patel" },
        { id: "4.8", name: "Distribution Studies", status: "complete", assignee: "Dr. Patel" },
        { id: "4.9", name: "Metabolism Studies", status: "warning", assignee: "Dr. Patel" },
        { id: "4.10", name: "Excretion Studies", status: "complete", assignee: "Dr. Patel" },
        { id: "4.11", name: "PK Drug Interactions", status: "critical", assignee: "Dr. Patel" },
        { id: "4.12", name: "Toxicology Study Reports", status: "complete", assignee: "Dr. Patel" },
        { id: "4.13", name: "Single-Dose Toxicity", status: "complete", assignee: "Dr. Patel" },
        { id: "4.14", name: "Repeat-Dose Toxicity", status: "warning", assignee: "Dr. Patel" },
        { id: "4.15", name: "Genotoxicity", status: "complete", assignee: "Dr. Patel" },
        { id: "4.16", name: "Carcinogenicity", status: "missing", assignee: "Dr. Patel" },
        { id: "4.17", name: "Reproductive Toxicity", status: "missing", assignee: "Dr. Patel" },
        { id: "4.18", name: "Local Tolerance", status: "warning", assignee: "Dr. Patel" },
        { id: "4.19", name: "Immunotoxicity", status: "missing", assignee: "Dr. Patel" },
        { id: "4.20", name: "Antigenicity", status: "missing", assignee: "Dr. Patel" },
        { id: "4.21", name: "Toxicokinetics", status: "complete", assignee: "Dr. Patel" },
        { id: "4.22", name: "Other Toxicity Studies", status: "missing", assignee: "Dr. Patel" },
      ],
    },
    {
      id: 5,
      name: "Module 5: Clinical",
      progress: 25,
      issues: 12,
      sections: 28,
      totalSections: 28,
      complete: 7,
      warning: 6,
      missing: 15,
      sectionsDetail: [
        { id: "5.1", name: "Clinical Study Reports", status: "complete", assignee: "Dr. Chen" },
        { id: "5.2", name: "Tabular Listing", status: "complete", assignee: "Dr. Chen" },
        { id: "5.3", name: "Clinical Overview", status: "complete", assignee: "Dr. Chen" },
        { id: "5.4", name: "Biopharm/PK Studies", status: "warning", assignee: "Dr. Chen" },
        { id: "5.5", name: "PK Study Reports", status: "warning", assignee: "Dr. Chen" },
        { id: "5.6", name: "Human Biomaterial", status: "critical", assignee: "Dr. Chen" },
        { id: "5.7", name: "Healthy Subject PK", status: "complete", assignee: "Dr. Chen" },
        { id: "5.8", name: "Patient PK", status: "warning", assignee: "Dr. Chen" },
        { id: "5.9", name: "Intrinsic Factor Studies", status: "missing", assignee: "Dr. Chen" },
        { id: "5.10", name: "Extrinsic Factor Studies", status: "missing", assignee: "Dr. Chen" },
        { id: "5.11", name: "Population PK", status: "missing", assignee: "Dr. Chen" },
        { id: "5.12", name: "Study Reports - PD", status: "complete", assignee: "Dr. Chen" },
        { id: "5.13", name: "Healthy Subject PD", status: "warning", assignee: "Dr. Chen" },
        { id: "5.14", name: "Patient PD", status: "complete", assignee: "Dr. Chen" },
        { id: "5.15", name: "Efficacy/Safety Studies", status: "critical", assignee: "Dr. Chen" },
        { id: "5.16", name: "Controlled Studies", status: "critical", assignee: "Dr. Chen" },
        { id: "5.17", name: "Uncontrolled Studies", status: "missing", assignee: "Dr. Chen" },
        { id: "5.18", name: "Analyses of Data", status: "missing", assignee: "Dr. Chen" },
        { id: "5.19", name: "Subject Disposition", status: "warning", assignee: "Dr. Chen" },
        { id: "5.20", name: "Demographic Analysis", status: "warning", assignee: "Dr. Chen" },
        { id: "5.21", name: "Efficacy Analysis", status: "missing", assignee: "Dr. Chen" },
        { id: "5.22", name: "Safety Analysis", status: "missing", assignee: "Dr. Chen" },
        { id: "5.23", name: "Drug Concentration", status: "missing", assignee: "Dr. Chen" },
        { id: "5.24", name: "Postmarketing Experience", status: "missing", assignee: "Sarah M." },
        { id: "5.25", name: "Case Report Forms", status: "complete", assignee: "Lisa K." },
        { id: "5.26", name: "Individual Patient Listings", status: "missing", assignee: "Dr. Chen" },
        { id: "5.27", name: "Literature References", status: "missing", assignee: "Sarah M." },
        { id: "5.28", name: "Other Clinical Information", status: "missing", assignee: "Dr. Chen" },
      ],
    },
  ],
}

export default function GapAnalysisDashboard() {
  const [selectedProject, setSelectedProject] = useState("ind-001")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedModule, setSelectedModule] = useState<number | null>(null)
  const [lastAnalysisDate, setLastAnalysisDate] = useState<Date>(new Date())
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
        analysisTimeoutRef.current = null
      }
    }
  }, [])

  const handleRunAnalysis = () => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }

    setIsAnalyzing(true)
    analysisTimeoutRef.current = setTimeout(() => {
      setIsAnalyzing(false)
      setLastAnalysisDate(new Date())
      analysisTimeoutRef.current = null
    }, 8000)
  }


  const handleExportReport = () => {
    alert("Exporting comprehensive gap analysis report...")
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">IND Gap Analysis & Readiness Tracker</h1>
          <p className="text-muted-foreground mt-1">Identify gaps and track readiness for FDA submission</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
            <Play className="w-4 h-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && <AnalysisProgress modules={mockData.modules} />}

      {/* Submission Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Timeline & Milestones</CardTitle>
          <CardDescription>Track your progress through the IND submission lifecycle</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <SubmissionTimeline />
        </CardContent>
      </Card>

      {/* Submission Progress and Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Issues Table */}
        <RecentIssuesTable lastAnalysisDate={lastAnalysisDate} />

        {/* Submission Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Progress</CardTitle>
            <CardDescription>Overall completion by module</CardDescription>
          </CardHeader>
          <CardContent>
            <RadialProgressChart modules={mockData.modules} />
          </CardContent>
        </Card>
      </div>

      {/* Module Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Module Status Overview</CardTitle>
          <CardDescription>
            Compact view of all sections - click &quot;View Sections&quot; to expand and see details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleStatusCards
            modules={mockData.modules}
            onSectionClick={(moduleId) => {
              setSelectedModule(moduleId)
            }}
          />
        </CardContent>
      </Card>

      {/* Issue Detail Dialog */}
      <IssueDetailDialog
        open={selectedModule !== null}
        onClose={() => setSelectedModule(null)}
        module={
          selectedModule !== null
            ? mockData.modules.find((m) => m.id === selectedModule) ?? null
            : null
        }
      />
    </div>
  )
}
