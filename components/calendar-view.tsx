// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useCallback, useState, type ChangeEvent, type MouseEvent } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  CheckSquare,
  AlertTriangle,
  Users,
  FolderOpen,
} from "lucide-react"

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 8, 10)) // September 10, 2025
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 8, 1)) // September 2025
  const [viewMode, setViewMode] = useState<"Month" | "Week" | "Day">("Month")

  const events = [
    {
      id: 1,
      title: "Harliku Phase II Review",
      date: "2025-09-10",
      type: "deadline",
      priority: "high",
      project: "Harliku Phase II",
    },
    {
      id: 2,
      title: "Yeztugo Study Submission",
      date: "2025-09-15",
      type: "task",
      priority: "medium",
      project: "Yeztugo Study",
    },
    {
      id: 3,
      title: "ABC Test Protocol Review",
      date: "2025-09-20",
      type: "deadline",
      priority: "high",
      project: "ABC Test In Oncology",
    },
  ]

  const metrics = [
    { label: "Total Events", value: 5, description: "This month", icon: CalendarIcon, color: "text-blue-600" },
    { label: "Deadlines", value: 3, description: "Due this month", icon: Clock, color: "text-red-600" },
    { label: "Tasks", value: 2, description: "Assigned this month", icon: CheckSquare, color: "text-blue-600" },
    {
      label: "High Priority",
      value: 3,
      description: "Requires attention",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ]

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((previousMonth) => {
      const nextMonth = new Date(previousMonth)
      if (direction === "prev") {
        nextMonth.setMonth(nextMonth.getMonth() - 1)
      } else {
        nextMonth.setMonth(nextMonth.getMonth() + 1)
      }
      return nextMonth
    })
  }, [])

  const handleViewModeClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const mode = event.currentTarget.dataset.mode as "Month" | "Week" | "Day" | undefined
    if (mode) setViewMode(mode)
  }, [])

  const handleYearChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const year = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(year)) return
    setCurrentMonth((previousMonth) => {
      const nextMonth = new Date(previousMonth)
      nextMonth.setFullYear(year)
      return nextMonth
    })
  }, [])

  const handlePreviousMonth = useCallback(() => {
    navigateMonth("prev")
  }, [navigateMonth])

  const handleNextMonth = useCallback(() => {
    navigateMonth("next")
  }, [navigateMonth])

  const handleTodayClick = useCallback(() => {
    setCurrentMonth(new Date())
  }, [])

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 min-h-0">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-600 mt-1">Track deadlines and assigned tasks across your projects</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                <option>Select team</option>
                <option>FilynAI Dev Team</option>
                <option>GenNova Therapeutics</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-gray-500" />
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                <option>Select project</option>
                <option>Harliku Phase II</option>
                <option>Yeztugo Study</option>
                <option>ABC Test In Oncology</option>
              </select>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {["Month", "Week", "Day"].map((mode) => (
                <button
                  key={mode}
                  data-mode={mode}
                  onClick={handleViewModeClick}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* Main Calendar Section */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Calendar View</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Click on a date to view details</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Month:</span>
                    <span className="text-sm">
                      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <span className="text-sm font-medium ml-4">Year:</span>
                    <select
                      value={currentMonth.getFullYear()}
                      onChange={handleYearChange}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleTodayClick}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="w-full"
                classNames={{
                  months: "flex w-full",
                  month: "w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-gray-500 rounded-md w-full font-normal text-sm flex-1 text-center py-2",
                  row: "flex w-full mt-2",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                  day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                  day_selected: "bg-purple-600 text-white hover:bg-purple-700",
                  day_today: "bg-gray-100 text-gray-900",
                  day_outside: "text-gray-400",
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col gap-6">
          {/* Events Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Events for September 2025</CardTitle>
              <p className="text-sm text-gray-600">Deadlines and tasks for the selected month</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1.5 rounded-md ${event.type === "deadline" ? "bg-red-100" : "bg-blue-100"}`}>
                    {event.type === "deadline" ? (
                      <Clock className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{event.project}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={event.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                        {event.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{event.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="grid grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{metric.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gray-50`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
