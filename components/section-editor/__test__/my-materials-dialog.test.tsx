// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

/* eslint-disable @next/next/no-img-element */
import type React from "react"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MyMaterialsDialog } from "@/components/section-editor/my-materials-dialog"

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"img">) => {
    const rest = { ...props }
    Reflect.deleteProperty(rest, "loader")
    Reflect.deleteProperty(rest, "unoptimized")
    return <img {...rest} /> // eslint-disable-line jsx-a11y/alt-text
  },
}))

describe("MyMaterialsDialog", () => {
  let consoleInfoSpy: jest.SpyInstance

  beforeAll(() => {
    if (!global.ResizeObserver) {
      global.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    }
  })

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleInfoSpy.mockRestore()
  })

  it("shows only topic materials and inserts selected topics", async () => {
    const onInsertMaterials = jest.fn()
    const materials = [
      {
        id: "topic-1",
        type: "topic",
        data: {
          id: "topic-1",
          title: "Topic A",
          content: "<p>Text</p>",
          images: [],
          tables: [],
        },
        timestamp: new Date("2024-01-01T00:00:00Z"),
      },
      {
        id: "text-1",
        type: "text",
        content: "Should not render",
        timestamp: new Date("2024-01-01T00:00:00Z"),
      },
    ]

    render(
      <MyMaterialsDialog
        open
        onOpenChange={jest.fn()}
        materials={materials}
        onInsertMaterials={onInsertMaterials}
      />,
    )

    expect(screen.getByText("Topic A")).toBeInTheDocument()
    expect(screen.queryByText("Should not render")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /insert selected/i }))

    expect(onInsertMaterials).toHaveBeenCalledTimes(1)
    const selected = onInsertMaterials.mock.calls[0][0]
    expect(selected).toHaveLength(1)
    expect(selected[0].type).toBe("topic")
    expect(selected[0].data.title).toBe("Topic A")
  })

  it("allows deselecting topics", async () => {
    const onInsertMaterials = jest.fn()
    const materials = [
      {
        id: "topic-1",
        type: "topic",
        data: {
          id: "topic-1",
          title: "Topic A",
          content: "<p>Text</p>",
          images: [],
          tables: [],
        },
        timestamp: new Date("2024-01-01T00:00:00Z"),
      },
    ]

    render(
      <MyMaterialsDialog
        open
        onOpenChange={jest.fn()}
        materials={materials}
        onInsertMaterials={onInsertMaterials}
      />,
    )

    const checkbox = screen.getByRole("checkbox")
    await userEvent.click(checkbox)

    const insertButton = screen.getByRole("button", { name: /insert selected/i })
    expect(insertButton).toBeDisabled()
  })
})
