// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useCallback, useState, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  MessageSquare,
  Users,
  Calendar,
  Filter,
  Search,
  History,
  Download,
  CheckCircle,
  ChevronRight,
  Reply,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react"

interface Document {
  id: string
  title: string
  module: string
  status: "In Review" | "Pending Review" | "Approved"
  daysLeft: number
  commentCount: number
  isOverdue?: boolean
}

interface Comment {
  id: string
  author: string
  role: string
  content: string
  timestamp: string
  avatar: string
}

export function ReviewCenterView({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const [selectedDocument, setSelectedDocument] = useState<string>("doc1")
  const [newComment, setNewComment] = useState("")
  const handleBackToWorkspace = useCallback(() => {
    onViewChange?.("workspace")
  }, [onViewChange])
  const handleSelectDocument = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const documentId = event.currentTarget.dataset.documentId
    if (documentId) setSelectedDocument(documentId)
  }, [])

  const documents: Document[] = [
    {
      id: "doc1",
      title: "ONX-2019 Phase 1 Dose...",
      module: "Module 1.6",
      status: "In Review",
      daysLeft: 6,
      commentCount: 8,
    },
    {
      id: "doc2",
      title: "ONX-2019 Protocol...",
      module: "Module 1.7",
      status: "In Review",
      daysLeft: 3,
      commentCount: 12,
    },
    {
      id: "doc3",
      title: "Quality Over...",
      module: "Module 2.3",
      status: "Pending Review",
      daysLeft: 11,
      commentCount: 0,
    },
    {
      id: "doc4",
      title: "FDA Form 1571 - ONX...",
      module: "Module 1.3",
      status: "Approved",
      daysLeft: 0,
      commentCount: 5,
      isOverdue: true,
    },
  ]

  const comments: Comment[] = [
    {
      id: "1",
      author: "Dr. Smith",
      role: "Clinical Lead",
      content:
        "The dose escalation scheme in section 6.1 should include intermediate dose levels between 4.0 and 8.0 mg/kg based on the steep PK curve observed in preclinical studies.",
      timestamp: "2 hours ago",
      avatar: "S",
    },
    {
      id: "2",
      author: "J. Martinez",
      role: "Biostatistician",
      content:
        "I recommend adding a Bayesian logistic regression model (BLRM) as an alternative to the 3+3 design to optimize dose escalation decisions and reduce patient exposure to subtherapeutic doses.",
      timestamp: "1 hour ago",
      avatar: "M",
    },
    {
      id: "3",
      author: "Dr. Chen",
      role: "Safety Lead",
      content:
        "The DLT definition should include Grade 2 pneumonitis given the mechanism of action and pulmonary toxicity observed with similar compounds in this class.",
      timestamp: "Yesterday",
      avatar: "C",
    },
    {
      id: "4",
      author: "Dr. Wilson",
      role: "Principal Investigator",
      content: "The PK sampling schedule looks comprehensive. This should provide adequate data for dose selection.",
      timestamp: "Yesterday",
      avatar: "W",
    },
  ]

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "In Review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Pending Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="bg-background border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToWorkspace}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspace
          </Button>
          <div className="text-sm text-muted-foreground">Review & Collaboration Center</div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Documents List */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold mb-4">Documents for Review</h2>

            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents..." className="pl-10" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                data-document-id={doc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDocument === doc.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={handleSelectDocument}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground">{doc.module}</p>
                    </div>
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`text-xs ${getStatusColor(doc.status)}`}>{doc.status}</Badge>
                    {doc.isOverdue ? (
                      <span className="text-xs text-red-600 font-medium">Overdue</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{doc.daysLeft} days left</span>
                    )}
                  </div>

                  {doc.commentCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      <span>{doc.commentCount} comments</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Document Header */}
          <div className="bg-background border-b border-border px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Select defaultValue="IND-104567-ONX-2019">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IND-104567-ONX-2019">IND-104567-ONX-2019</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="dose-escalation">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dose-escalation">Dose Escalation...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">ONX-2019 Phase 1 Dose-Escalation Study v2.1</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  Version History
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Due: Jan 28, 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Assigned to: Dr. Wilson, Dr. Smith, J. Martinez</span>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Document Content</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Page 1 of 45</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">6.1 Dose Escalation Design</h3>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">
                  This Phase 1 dose-escalation study employs a modified 3+3 design to determine the maximum tolerated dose (MTD) 
                  and recommended Phase 2 dose (RP2D) of ONX-2019 in patients with advanced solid tumors. The starting dose of 
                  0.5 mg/kg was selected based on 1/10th of the severely toxic dose in 10% of animals (STD10) from non-human 
                  primate studies, providing an adequate safety margin.
                </p>

                <p className="mb-4">
                  Dose escalation will proceed through the following cohorts: 0.5, 1.0, 2.0, 4.0, 6.0, 8.0, and 12.0 mg/kg 
                  administered intravenously every 21 days. Each cohort will enroll a minimum of 3 patients, with expansion to 
                  6 patients if one dose-limiting toxicity (DLT) occurs during the first cycle. Escalation to the next dose 
                  level requires completion of the DLT evaluation period by all patients in the current cohort.
                </p>

                <p className="mb-4">
                  Dose-limiting toxicities are defined as any Grade 4 hematologic toxicity lasting &gt;7 days, Grade 3 
                  thrombocytopenia with bleeding, Grade 3 or 4 non-hematologic toxicity (excluding nausea/vomiting responsive 
                  to standard care), or any toxicity requiring dose delay &gt;14 days during Cycle 1. The MTD is defined as the 
                  highest dose level at which ≤1 of 6 patients experiences a DLT.
                </p>

                <p className="mb-4">
                  Pharmacokinetic sampling will be performed at multiple timepoints during Cycle 1 to characterize ONX-2019 
                  exposure across dose levels. Blood samples will be collected pre-dose and at 0.5, 1, 2, 4, 8, 24, 48, 72, 
                  168, 336, and 504 hours post-infusion. PK parameters including Cmax, AUC, half-life, and clearance will be 
                  calculated using non-compartmental analysis.
                </p>

                <p>
                  An expansion cohort of up to 20 patients will be enrolled at the MTD or RP2D to further evaluate safety, 
                  tolerability, and preliminary efficacy. Patients in the expansion cohort must have measurable disease per 
                  RECIST v1.1 criteria and will undergo tumor assessments every 6 weeks for the first 24 weeks, then every 
                  12 weeks thereafter until disease progression or treatment discontinuation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Comments */}
        <div className="w-80 bg-card border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold mb-4">Comments & Feedback</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {comment.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      {comment.role && (
                        <Badge variant="outline" className="text-xs">
                          {comment.role}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <h4 className="font-medium mb-3 text-sm">Add Comment</h4>
            <Textarea
              placeholder="Add your comment or feedback..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-3 min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                Comment
              </Button>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
