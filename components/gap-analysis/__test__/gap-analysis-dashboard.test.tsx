// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import React from "react"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import GapAnalysisDashboard from "../gap-analysis-dashboard"

jest.mock("../analysis-progress", () => ({
  AnalysisProgress: () => <div data-testid="analysis-progress">analysis-progress</div>,
}))

jest.mock("../radial-progress-chart", () => ({
  RadialProgressChart: () => <div data-testid="radial-progress-chart">radial-progress-chart</div>,
}))

jest.mock("../recent-issues-table", () => ({
  RecentIssuesTable: () => <div data-testid="recent-issues-table">recent-issues-table</div>,
}))

let lastIssueDialogProps: unknown
jest.mock("../issue-detail-dialog", () => ({
  IssueDetailDialog: (props: unknown) => {
    lastIssueDialogProps = props
    return (props as { open: boolean }).open ? <div data-testid="issue-dialog">issue-dialog</div> : null
  },
}))

jest.mock("../submission-timeline", () => ({
  SubmissionTimeline: () => <div data-testid="submission-timeline">submission-timeline</div>,
}))

jest.mock("../module-status-cards", () => ({
  ModuleStatusCards: (props: {
    modules: Array<{ id: number }>
    onSectionClick?: (moduleId: number, sectionId: string) => void
  }) => (
    <div data-testid="module-status-cards">
      <button onClick={() => props.onSectionClick?.(props.modules[0]?.id ?? 0, "section-1")}>open section</button>
    </div>
  ),
}))

describe("GapAnalysisDashboard", () => {
  const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

  afterAll(() => {
    alertSpy.mockRestore()
  })

  afterEach(() => {
    jest.useRealTimers()
    alertSpy.mockClear()
    lastIssueDialogProps = undefined
  })

  it("starts analysis and completes after timeout", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null })

    render(<GapAnalysisDashboard />)

    expect(screen.getByText("IND Gap Analysis & Readiness Tracker")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /run analysis/i }))
    expect(screen.getByTestId("analysis-progress")).toBeInTheDocument()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(screen.queryByTestId("analysis-progress")).not.toBeInTheDocument()
  })

  it("opens issue detail dialog when a module section is selected", async () => {
    const user = userEvent.setup()

    render(<GapAnalysisDashboard />)

    await user.click(screen.getByText("open section"))

    expect(screen.getByTestId("issue-dialog")).toBeInTheDocument()
    expect((lastIssueDialogProps as { module: { id: number } }).module.id).toBe(1)
  })
})
