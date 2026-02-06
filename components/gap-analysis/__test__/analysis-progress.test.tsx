// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import React from "react"
import { act, render, screen } from "@testing-library/react"

import { AnalysisProgress } from "../analysis-progress"

describe("AnalysisProgress", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it("shows empty state when there are no modules", () => {
    render(<AnalysisProgress modules={[]} />)

    expect(screen.getByText("No modules to analyze yet.")).toBeInTheDocument()
  })

  it("animates through modules over time", () => {
    jest.useFakeTimers()
    const modules = [
      { id: 1, name: "Module 1" },
      { id: 2, name: "Module 2" },
      { id: 3, name: "Module 3" },
    ]

    render(<AnalysisProgress modules={modules} />)

    expect(screen.getByText("Running Full Validation")).toBeInTheDocument()
    expect(screen.getAllByText(/Module/)).toHaveLength(modules.length)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    const progressText = screen.getByText(/Complete/).textContent ?? ""
    const progressValue = parseInt(progressText, 10)
    expect(progressValue).toBeGreaterThan(0)

    act(() => {
      jest.clearAllTimers()
    })
  })
})
