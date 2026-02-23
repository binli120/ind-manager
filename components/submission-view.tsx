// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { useCallback, useState, type MouseEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, FileText, Upload, Shield, Send, Mail, Eye } from "lucide-react"

export function SubmissionView() {
  const [activeTab, setActiveTab] = useState<"process" | "acknowledgment" | "tracking">("process")
  const handleTabClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const tabId = event.currentTarget.dataset.tabId as typeof activeTab | undefined
    if (tabId) setActiveTab(tabId)
  }, [])

  const checklistItems = [
    {
      title: "eCTD Validation",
      status: "Complete",
      required: true,
      icon: CheckCircle2,
      description: "Document structure validated",
    },
    {
      title: "Final Document Approval",
      status: "Complete",
      required: true,
      icon: CheckCircle2,
      description: "All documents approved",
    },
    {
      title: "eCTD Package Generated",
      status: "Complete",
      required: true,
      icon: CheckCircle2,
      description: "Package ready for submission",
    },
    {
      title: "FDA ESG Credentials Verified",
      status: "Complete",
      required: true,
      icon: CheckCircle2,
      description: "Authentication confirmed",
    },
    {
      title: "Submission Backup Created",
      status: "Complete",
      required: true,
      icon: CheckCircle2,
      description: "Backup stored securely",
    },
    {
      title: "Team Notification",
      status: "Pending",
      required: false,
      icon: Clock,
      description: "Notify team members",
    },
  ]

  const submissionSteps = [
    {
      step: 1,
      title: "Login to FDA ESG",
      description: "Authenticate with FDA credentials",
      status: "pending",
      icon: Shield,
    },
    {
      step: 2,
      title: "Upload eCTD Package",
      description: "Upload ZIP file to ESG portal",
      status: "pending",
      icon: Upload,
    },
    {
      step: 3,
      title: "ESG Validation",
      description: "FDA system validates submission",
      status: "pending",
      icon: CheckCircle2,
    },
    {
      step: 4,
      title: "Submission Confirmation",
      description: "Receive confirmation number",
      status: "pending",
      icon: Send,
    },
    {
      step: 5,
      title: "Acknowledgment Receipt",
      description: "FDA sends acknowledgment letter",
      status: "pending",
      icon: Mail,
    },
  ]

  const tabs = [
    { id: "process", label: "Submission Process", active: activeTab === "process" },
    { id: "acknowledgment", label: "Acknowledgment", active: activeTab === "acknowledgment" },
    { id: "tracking", label: "Tracking", active: activeTab === "tracking" },
  ]

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 min-h-0">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">IND Submission & Acknowledgment Tracking</h1>
            <p className="text-sm text-gray-600 mt-1">Track your IND application from preparation to submission</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">IND-104567-XYZ-123</span>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={handleTabClick}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab.active
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* Left Column - Status & Checklist */}
        <div className="w-80 flex flex-col gap-6">
          {/* Current Status */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Current Status</CardTitle>
              <p className="text-sm text-gray-600">Submission progress and status</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                    Ready
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pre-Submission Checklist */}
          <Card className="shadow-sm flex-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Pre-Submission Checklist</CardTitle>
              <p className="text-sm text-gray-600">Verify all requirements before submission</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1.5 rounded-md ${item.status === "Complete" ? "bg-green-100" : "bg-orange-100"}`}>
                    <item.icon
                      className={`h-4 w-4 ${item.status === "Complete" ? "text-green-600" : "text-orange-600"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{item.title}</p>
                      {item.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    <Badge
                      variant={item.status === "Complete" ? "secondary" : "outline"}
                      className={`text-xs mt-2 ${
                        item.status === "Complete" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Submission Process */}
        <div className="flex-1 flex flex-col gap-6">
          {/* FDA ESG Submission Process */}
          <Card className="shadow-sm flex-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">FDA ESG Submission Process</CardTitle>
              <p className="text-sm text-gray-600">Step-by-step submission workflow</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {submissionSteps.map((step, index) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          step.status === "completed"
                            ? "bg-green-600 text-white"
                            : step.status === "active"
                              ? "bg-purple-600 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {step.step}
                      </div>
                      {index < submissionSteps.length - 1 && <div className="w-px h-12 bg-gray-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${
                            step.status === "completed"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : step.status === "active"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {step.status === "completed"
                            ? "Complete"
                            : step.status === "active"
                              ? "In Progress"
                              : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submission Package */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Submission Package</CardTitle>
              <p className="text-sm text-gray-600">Documents and files for submission</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">eCTD Package (ZIP)</p>
                    <p className="text-sm text-gray-600">Ready for upload to FDA ESG</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
