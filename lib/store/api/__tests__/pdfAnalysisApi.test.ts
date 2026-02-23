// Author: Bin Lee
// Email: binlee120@gmail.com

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

  it("recovers malformed concatenated json payloads by using the latest object", async () => {
    const response: MockResponse = {
      ok: true,
      status: 200,
      text: async () => '{"tabulated_id":"old"}{"tabulated_id":"latest"}',
      headers: { get: () => null },
    }
    mockFetch.mockResolvedValue(response)

    const payload = await requestPdfAnalysisApi<{ tabulated_id: string }>({
      path: "/ncd/assets/tabulated",
      method: "POST",
      body: {},
    })

    expect(payload.tabulated_id).toBe("latest")
  })

  it("repairs invalid json escapes in response strings", async () => {
    const response: MockResponse = {
      ok: true,
      status: 200,
      text: async () => '{"summary_text":"IgG1\\κ"}',
      headers: { get: () => null },
    }
    mockFetch.mockResolvedValue(response)

    const payload = await requestPdfAnalysisApi<{ summary_text: string }>({
      path: "/ncd/assets/tabulated",
      method: "POST",
      body: {},
    })

    expect(payload.summary_text).toBe("IgG1\\κ")
  })

  it("filters sparse tabulated rows that are mostly empty", async () => {
    const response: MockResponse = {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          tables: [
            {
              columns: [
                "Type of Study",
                "Test System",
                "Method of Administration",
                "Testing Facility",
                "Study Number",
                "Location in CTD",
              ],
              rows: [
                {
                  "Type of Study": "",
                  "Test System": "",
                  "Method of Administration": "",
                  "Testing Facility": "",
                  "Study Number": "LT1002-treated",
                  "Location in CTD": "",
                },
                {
                  "Type of Study": "Safety pharmacology",
                  "Test System": "Rat",
                  "Method of Administration": "intravenous",
                  "Testing Facility": "LAB Research Inc.",
                  "Study Number": "DOC-117-1179759E",
                  "Location in CTD": "Module 4, Section 4.2.1.3",
                },
              ],
            },
          ],
        }),
      headers: { get: () => null },
    }
    mockFetch.mockResolvedValue(response)

    const payload = await requestPdfAnalysisApi<{
      tables: Array<{ rows: Array<Record<string, string>> }>
    }>({
      path: "/ncd/assets/tabulated",
      method: "POST",
      body: {},
    })

    expect(payload.tables[0].rows).toHaveLength(1)
    expect(payload.tables[0].rows[0]["Study Number"]).toBe("DOC-117-1179759E")
  })

  it("fills missing method of administration from location context", async () => {
    const response: MockResponse = {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          tables: [
            {
              columns: [
                "Type of Study",
                "Test System",
                "Method of Administration",
                "Testing Facility",
                "Study Number",
                "Location in CTD",
              ],
              rows: [
                {
                  "Type of Study": "Safety pharmacology",
                  "Test System": "Rat",
                  "Method of Administration": "",
                  "Testing Facility":
                    "Charles River Laboratories Preclinical Services Montreal Inc.",
                  "Study Number": "DOC-597-5976AD7B",
                  "Location in CTD":
                    'Module 4, Section 4.2.1.3: "In Vitro Evaluation of the Influence of LT1009 on Human Whole Blood Hemolysis and Plasma Flocculation"',
                },
              ],
            },
          ],
        }),
      headers: { get: () => null },
    }
    mockFetch.mockResolvedValue(response)

    const payload = await requestPdfAnalysisApi<{
      tables: Array<{ rows: Array<Record<string, string>> }>
    }>({
      path: "/ncd/assets/tabulated",
      method: "POST",
      body: {},
    })

    expect(payload.tables[0].rows[0]["Method of Administration"]).toBe("in vitro")
  })
})
