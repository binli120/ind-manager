import { PdfAnalysisApiError, requestPdfAnalysisApi } from "../pdfAnalysisApi"

type MockResponse = {
  ok: boolean
  status: number
  statusText?: string
  text: () => Promise<string>
  headers: { get: (key: string) => string | null }
}

const mockFetch = jest.fn()

describe("pdfAnalysisApi", () => {
  beforeAll(() => {
    global.fetch = mockFetch as unknown as typeof fetch
  })

  beforeEach(() => {
    mockFetch.mockReset()
    delete process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL
  })

  it("sets json body and user-id header", async () => {
    const response: MockResponse = {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
      headers: { get: () => null },
    }
    mockFetch.mockResolvedValue(response)

    await requestPdfAnalysisApi({
      path: "/api/test",
      method: "POST",
      body: { hello: "world" },
      userIdHeader: "user-1",
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers["Content-Type"]).toBe("application/json")
    expect(init.headers["user-id"]).toBe("user-1")
    expect(init.body).toBe(JSON.stringify({ hello: "world" }))
  })

  it("throws PdfAnalysisApiError on redirect when redirects are blocked", async () => {
    const response: MockResponse = {
      ok: false,
      status: 302,
      statusText: "Found",
      text: async () => "",
      headers: { get: (key: string) => (key === "location" ? "/login" : null) },
    }
    mockFetch.mockResolvedValue(response)

    await expect(
      requestPdfAnalysisApi({
        path: "/api/test",
        method: "GET",
        suppressErrorLog: true,
      }),
    ).rejects.toBeInstanceOf(PdfAnalysisApiError)
  })

  it("throws PdfAnalysisApiError with upstream message", async () => {
    const response: MockResponse = {
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ message: "Bad input" }),
      headers: { get: () => null },
    }
    mockFetch.mockResolvedValue(response)

    await expect(
      requestPdfAnalysisApi({
        path: "/api/test",
        method: "GET",
        suppressErrorLog: true,
      }),
    ).rejects.toMatchObject({
      message: "Bad input",
      status: 400,
    })
  })
})
