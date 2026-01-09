// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

export function IndSubmissionView() {
  const checklistItems = [
    {
      title: "eCTD Validation",
      status: "Complete",
      required: true,
      description: "Electronic Common Technical Document validation completed",
    },
    {
      title: "Final Document Approval",
      status: "Complete",
      required: true,
      description: "All documents have been reviewed and approved",
    },
    {
      title: "eCTD Package Generated",
      status: "Complete",
      required: true,
      description: "Electronic submission package has been generated",
    },
    {
      title: "FDA ESG Credentials Verified",
      status: "Complete",
      required: true,
      description: "Electronic Submission Gateway credentials confirmed",
    },
    {
      title: "Submission Backup Created",
      status: "Complete",
      required: true,
      description: "Complete backup of submission materials created",
    },
    {
      title: "Team Notification Prepared",
      status: "Pending",
      required: true,
      description: "Notification system ready for submission updates",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Complete":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === "Complete" ? "default" : status === "Pending" ? "secondary" : "destructive"
    return (
      <Badge variant={variant} className="ml-auto">
        {status}
      </Badge>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">IND Submission Process</h1>
          <p className="text-muted-foreground mt-1">Track your IND application preparation and submission</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">IND-104567: XYZ-123</span>
          <Button variant="outline">View Details</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Current Status & Pre-Submission Checklist */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <p className="text-sm text-muted-foreground">Submission progress and status</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Ready
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pre-Submission Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Submission Checklist</CardTitle>
              <p className="text-sm text-muted-foreground">Verify all requirements before submission</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(item.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    {item.required && <p className="text-xs text-muted-foreground mb-1">Required</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Submission Actions & Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Ready to submit your IND application</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Ready for Submission</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    All pre-submission requirements have been completed. You can now proceed with the IND submission.
                  </p>
                  <Button className="w-full">Submit IND Application</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                <span>Pre-submission checklist completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                <span>Ready for submission</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>FDA acknowledgment (24-48 hours after submission)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
