// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { useCallback, useState, type MouseEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Clock, AlertTriangle, FileText, Search, Calendar, Phone, Eye, Edit3 } from "lucide-react"

export function PostSubmissionView() {
  const [activeTab, setActiveTab] = useState<"correspondence" | "timeline" | "actions">("correspondence")
  const [selectedCorrespondence, setSelectedCorrespondence] = useState("info-request")
  const handleTabClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const tabId = event.currentTarget.dataset.tabId as typeof activeTab | undefined
    if (tabId) setActiveTab(tabId)
  }, [])
  const handleSelectCorrespondence = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const correspondenceId = event.currentTarget.dataset.correspondenceId
    if (correspondenceId) setSelectedCorrespondence(correspondenceId)
  }, [])

  const correspondenceItems = [
    {
      id: "acknowledgment",
      type: "Acknowledgment Letter",
      status: "Received",
      priority: "Normal",
      date: "2024-01-23",
      daysSince: 1,
      description: "FDA acknowledges receipt of IND-104567",
      icon: CheckCircle2,
      statusColor: "green",
    },
    {
      id: "info-request",
      type: "Information Request",
      status: "Pending Response",
      priority: "Critical",
      date: "2024-02-15",
      daysSince: 24,
      description: "Request for additional CMC information regarding drug substance specifications",
      icon: Clock,
      statusColor: "orange",
      responseRequired: true,
      daysToRespond: 14,
    },
    {
      id: "clinical-hold",
      type: "Clinical Hold Letter",
      status: "Action Required",
      priority: "Critical",
      date: "2024-02-20",
      daysSince: 29,
      description: "Clinical hold placed due to insufficient toxicology data",
      icon: AlertTriangle,
      statusColor: "red",
      responseRequired: true,
      daysToRespond: 28,
    },
  ]

  const selectedItem = correspondenceItems.find((item) => item.id === selectedCorrespondence)

  const tabs = [
    { id: "correspondence", label: "Correspondence", active: activeTab === "correspondence" },
    { id: "timeline", label: "Timeline", active: activeTab === "timeline" },
    { id: "actions", label: "Actions", active: activeTab === "actions" },
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Received":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending Response":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Action Required":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Normal":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 min-h-0">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Post-Submission Management</h1>
            <p className="text-sm text-gray-600 mt-1">Track FDA correspondence and manage post-submission activities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">IND-104567-XYZ-t23</span>
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
        {/* Left Column - FDA Correspondence */}
        <div className="w-96 flex flex-col gap-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">FDA Correspondence</CardTitle>
              <p className="text-sm text-gray-600">All correspondence from FDA regarding IND-104567</p>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search correspondence..." className="pl-10" />
              </div>

              {/* Correspondence List */}
              <div className="space-y-3">
                {correspondenceItems.map((item) => (
                  <div
                    key={item.id}
                    data-correspondence-id={item.id}
                    onClick={handleSelectCorrespondence}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCorrespondence === item.id
                        ? "border-purple-200 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded-md ${
                          item.statusColor === "green"
                            ? "bg-green-100"
                            : item.statusColor === "orange"
                              ? "bg-orange-100"
                              : "bg-red-100"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${
                            item.statusColor === "green"
                              ? "text-green-600"
                              : item.statusColor === "orange"
                                ? "text-orange-600"
                                : "text-red-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm text-gray-900">{item.type}</h3>
                          <Badge variant="outline" className={getStatusBadgeColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Day {item.daysSince} • {item.date}
                          </span>
                          {item.responseRequired && (
                            <span className="text-orange-600 font-medium">{item.daysToRespond} days to respond</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Correspondence Details */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedItem && (
            <>
              {/* Information Request Details */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">{selectedItem.type}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Day {selectedItem.daysSince} after submission</p>
                    </div>
                    <Badge variant="outline" className={getPriorityBadgeColor(selectedItem.priority)}>
                      {selectedItem.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Correspondence Details</h3>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Date Received:</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedItem.date}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Priority:</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedItem.priority}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedItem.status}</p>
                      </div>
                      {selectedItem.responseRequired && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Response Required:</label>
                          <p className="text-sm text-gray-900 mt-1">Yes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Actions */}
              {selectedItem.responseRequired && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Response Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button className="bg-purple-600 text-white hover:bg-purple-700">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Draft Response
                      </Button>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                      <Button variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact FDA
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
