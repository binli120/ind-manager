/* eslint-disable @next/next/no-img-element */
import type React from "react"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MaterialsDialog } from "@/components/section-editor/materials-dialog"
import { requestPdfAnalysisApi } from "@/lib/store/api/pdfAnalysisApi"

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"img">) => {
    const { loader, unoptimized, ...rest } = props
    return <img {...rest} /> // eslint-disable-line jsx-a11y/alt-text
  },
}))

jest.mock("@/lib/store/api/pdfAnalysisApi", () => ({
  requestPdfAnalysisApi: jest.fn(),
}))

describe("MaterialsDialog", () => {
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
    ;(requestPdfAnalysisApi as jest.Mock).mockReset()
  })

  it("loads topics and adds a topic to My Materials", async () => {
    const payload = {
      section: "4",
      documents: [
        {
          id: "doc-1",
          name: "Doc 1",
          section: "4.1",
          topics: [
            {
              id: "topic-1",
              title: "Topic A",
              content: "<p>Hello world</p>",
              images: [{ id: "img-1", title: "Img 1", url: "https://example.com/img.png" }],
              tables: [{ id: "tbl-1", title: "Table 1", headers: ["H1"], rows: [["C1"]] }],
            },
          ],
        },
      ],
      source: "test",
    }

    ;(requestPdfAnalysisApi as jest.Mock).mockResolvedValue(payload)

    const onMaterialsChange = jest.fn()
    const onMaterialsCountChange = jest.fn()

    render(
      <MaterialsDialog
        open
        onOpenChange={jest.fn()}
        keyword=""
        materials={[]}
        onMaterialsChange={onMaterialsChange}
        onMaterialsCountChange={onMaterialsCountChange}
      />,
    )

    expect(await screen.findByRole("button", { name: /doc 1/i })).toBeInTheDocument()
    expect(await screen.findByText("Topic A")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /add topic/i }))

    expect(onMaterialsChange).toHaveBeenCalledTimes(1)
    const next = onMaterialsChange.mock.calls[0][0]
    expect(next[0].type).toBe("topic")
    expect(next[0].data.title).toBe("Topic A")
    expect(next[0].data.images).toHaveLength(1)
    expect(next[0].data.tables).toHaveLength(1)
    expect(next[0].data.document.name).toBe("Doc 1")
  })
})
