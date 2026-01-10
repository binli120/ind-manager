"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertCircle, AlertTriangle, Info } from "lucide-react"

interface Issue {
  id: string
  time: string
  description: string
  fullDescription: string
  severity: "critical" | "warning" | "info"
  documentName: string
  documentPath: string
  module: string
}

interface RecentIssuesTableProps {
  lastAnalysisDate: Date
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

// Mock data for recent issues
const recentIssues: Issue[] = [
  {
    id: "1",
    time: "2 min ago",
    description: "Missing required safety data in toxicology summary report",
    fullDescription:
      "The toxicology summary report in Module 4 is missing critical safety data for the 90-day repeat-dose toxicity study. FDA requires complete documentation of all observed adverse effects, including detailed histopathology findings and dose-response relationships. This is a submission-blocking issue that must be resolved before FDA review.",
    severity: "critical",
    documentName: "M4_Toxicology_Summary.pdf",
    documentPath: "/documents/module4/toxicology/summary.pdf",
    module: "Module 4",
  },
  {
    id: "2",
    time: "15 min ago",
    description: "Incomplete stability data for drug product batches 001-003",
    fullDescription:
      "The stability protocol section is missing 6-month stability data for three drug product batches (001, 002, and 003). While 3-month data is present, FDA typically requires at least 6 months of stability data at time of submission to support the proposed shelf life and storage conditions.",
    severity: "warning",
    documentName: "M3_Stability_Protocol.pdf",
    documentPath: "/documents/module3/stability/protocol.pdf",
    module: "Module 3",
  },
  {
    id: "3",
    time: "32 min ago",
    description: "Protocol deviation not documented in clinical study report",
    fullDescription:
      "Clinical Study Report CSR-001 references a protocol deviation (enrollment of subject outside age range) but lacks the formal deviation documentation and impact assessment required by FDA. Include the deviation report, root cause analysis, and justification for subject inclusion.",
    severity: "critical",
    documentName: "CSR-001_Clinical_Report.pdf",
    documentPath: "/documents/module5/clinical/csr-001.pdf",
    module: "Module 5",
  },
  {
    id: "4",
    time: "1 hour ago",
    description: "FDA Form 1571 missing investigator signature on page 4",
    fullDescription:
      "The submitted FDA Form 1571 is missing the principal investigator's signature on page 4, section 8. While all other sections are complete, the form cannot be considered valid without this required signature. Please obtain the signature and replace the form.",
    severity: "warning",
    documentName: "FDA_Form_1571.pdf",
    documentPath: "/documents/module1/forms/1571.pdf",
    module: "Module 1",
  },
  {
    id: "5",
    time: "2 hours ago",
    description: "Table of contents pagination mismatch with actual document",
    fullDescription:
      "The master table of contents lists Module 2 Clinical Summary starting on page 145, but the actual document begins on page 148. This pagination discrepancy exists for approximately 8 sections and should be corrected to ensure FDA reviewers can navigate the submission efficiently.",
    severity: "info",
    documentName: "Master_TOC.pdf",
    documentPath: "/documents/module1/toc/master.pdf",
    module: "Module 1",
  },
  {
    id: "6",
    time: "3 hours ago",
    description: "Pharmacokinetics study report missing statistical analysis plan",
    fullDescription:
      "The PK study report in Module 5 includes results and conclusions but does not reference or include the statistical analysis plan (SAP) that was used to analyze the data. FDA expects to see the pre-specified analysis methods. Please append the SAP as an attachment to the study report.",
    severity: "warning",
    documentName: "PK_Study_Report_001.pdf",
    documentPath: "/documents/module5/pk/study-001.pdf",
    module: "Module 5",
  },
]

export function RecentIssuesTable({ lastAnalysisDate }: RecentIssuesTableProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  const getSeverityIcon = (severity: Issue["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: Issue["severity"]): BadgeVariant => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "warning":
        return "warning"
      default:
        return "secondary"
    }
  }

  const handleDocumentClick = (documentPath: string) => {
    // Navigate to document editor/viewer
    console.log("[v0] Opening document:", documentPath)
    alert(`Opening document viewer for: ${documentPath}`)
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
          <CardDescription>
            Latest findings from analysis ordered by time (last analyzed {lastAnalysisDate.toLocaleString()})
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-hidden">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] whitespace-nowrap">Time</TableHead>
                <TableHead className="w-auto">Description</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentIssues.map((issue) => (
                <TableRow key={issue.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {issue.time}
                  </TableCell>
                  <TableCell
                    onClick={() => setSelectedIssue(issue)}
                    className="font-medium hover:text-primary transition-colors max-w-0"
                  >
                    <div className="text-sm line-clamp-2 break-words">
                      {issue.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(issue.severity)} className="gap-1">
                      {getSeverityIcon(issue.severity)}
                      {issue.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Issue Detail Dialog */}
      <Dialog open={selectedIssue !== null} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle>Issue Details</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium">{selectedIssue?.module}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm">{selectedIssue?.time}</span>
                </DialogDescription>
              </div>
              {selectedIssue && (
                <Badge variant={getSeverityColor(selectedIssue.severity)} className="gap-1">
                  {getSeverityIcon(selectedIssue.severity)}
                  {selectedIssue.severity}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedIssue?.fullDescription}</p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Document:</span>
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-medium"
                onClick={() => selectedIssue && handleDocumentClick(selectedIssue.documentPath)}
              >
                {selectedIssue?.documentName}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setSelectedIssue(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
