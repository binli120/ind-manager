// Author: Bin Lee
// Email: binlee120@gmail.com
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ModuleStatusCards } from "../module-status-cards"

const modules = [
  {
    id: 1,
    name: "Module 1: Administrative",
    progress: 85,
    totalSections: 3,
    complete: 1,
    warning: 1,
    issues: 1,
    missing: 0,
    sectionsDetail: [
      { id: "1.1", name: "Section 1", status: "complete", assignee: "Alex" },
      { id: "1.2", name: "Section 2", status: "warning", assignee: "Brooke" },
      { id: "1.3", name: "Section 3", status: "missing", assignee: "Casey" },
    ],
  },
]

describe("ModuleStatusCards", () => {
  it("shows module details and expands sections", async () => {
    const user = userEvent.setup()
    render(<ModuleStatusCards modules={modules} />)

    expect(screen.getByText(modules[0].name)).toBeInTheDocument()
    expect(screen.getByText("85%")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /view sections/i }))

    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("Section 2")).toBeInTheDocument()
  })

  it("invokes onSectionClick when a section is clicked", async () => {
    const user = userEvent.setup()
    const onSectionClick = jest.fn()

    render(<ModuleStatusCards modules={modules} onSectionClick={onSectionClick} />)

    await user.click(screen.getByRole("button", { name: /view sections/i }))
    await user.click(screen.getByText("Section 1"))

    expect(onSectionClick).toHaveBeenCalledWith(modules[0].id, "1.1")
  })
})
