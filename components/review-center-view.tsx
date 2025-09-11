"use client"

import { useState } from "react"
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

  const documents: Document[] = [
    {
      id: "doc1",
      title: "XYZ-123 Investigator...",
      module: "Module 1.6",
      status: "In Review",
      daysLeft: 6,
      commentCount: 8,
    },
    {
      id: "doc2",
      title: "XYZ-123 Phase 1 P...",
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
      title: "FDA Form 1571 - X...",
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
        "The dosing rationale in section 4.2 needs to be updated to reflect the latest PK data from Study XYZ-123-001.",
      timestamp: "2 hours ago",
      avatar: "S",
    },
    {
      id: "2",
      author: "J. Martinez",
      role: "",
      content:
        "I agree. The PK data shows a different half-life than what was originally assumed. We should update the dosing schedule accordingly.",
      timestamp: "1 hour ago",
      avatar: "M",
    },
    {
      id: "3",
      author: "Dr. Chen",
      role: "CMC Lead",
      content:
        "The manufacturing process details in section 3.2.P.5 are incomplete. Please provide the batch records and validation data.",
      timestamp: "Yesterday",
      avatar: "C",
    },
    {
      id: "4",
      author: "Dr. Wilson",
      role: "",
      content: "Looks good now, thank you.",
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

  const selectedDoc = documents.find((doc) => doc.id === selectedDocument)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="bg-background border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange?.("workspace")}
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
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDocument === doc.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedDocument(doc.id)}
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
                <Select defaultValue="IND-104567-XYZ-123">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IND-104567-XYZ-123">IND-104567-XYZ-123</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="investigator">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigator">Investigator...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">XYZ-123 Investigator Brochure v2.1</h1>
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
                <h3 className="text-lg font-semibold">4.2 Dosing Rationale</h3>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="mb-4">
                  The recommended starting dose of 50 mg BID was selected based on preclinical efficacy data and safety
                  margins established in toxicology studies. This dose achieves steady-state plasma concentrations of
                  2.5-3.0 μg/mL, which corresponds to 85-90% target engagement in vitro.
                </p>

                <p className="mb-4">
                  Dose escalation to 100 mg BID may be considered based on individual patient response and tolerability.
                  The maximum tolerated dose (MTD) was established at 150 mg BID in the Phase 1 study, with dose-
                  limiting toxicities including grade 3 transaminase elevations in 2/6 patients.
                </p>

                <p className="mb-4">
                  Population PK modeling indicates that the 100 mg BID dose provides optimal exposure in the target
                  patient population, with predicted trough concentrations of 1.8-2.2 μg/mL at steady state. This
                  exposure level is associated with &gt;90% target engagement and maintains the established safety
                  margin of 5-fold below the NOAEL.
                </p>

                <p className="mb-4">
                  The dosing interval of twice daily (BID) was selected based on the compound's half-life of 8-12 hours
                  and the need to maintain consistent target engagement throughout the dosing period. PK simulations
                  demonstrate that BID dosing provides more stable exposure compared to once-daily dosing, with reduced
                  peak-to-trough ratios and improved efficacy in preclinical models.
                </p>

                <p>
                  Special populations including elderly patients (&gt;=65 years) and those with mild hepatic impairment
                  (Child-Pugh A) do not require dose adjustment based on population PK analysis. However, patients with
                  moderate hepatic impairment (Child-Pugh B) should receive 50 mg BID instead of the standard 100 mg
                  dose based on increased exposure observed in this population.
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
