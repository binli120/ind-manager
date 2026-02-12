// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { resolvePdfAnalysisApiBaseUrl } from "../pdfAnalysisApiBaseUrl";

describe("resolvePdfAnalysisApiBaseUrl", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalServerBase = process.env.PDF_ANALYSIS_API_BASE_URL;
  const originalPublicBase = process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL;
  const originalLegacyBase = process.env.NEXT_PUBLIC_ANALYSIS_API_URL;

  beforeEach(() => {
    delete process.env.PDF_ANALYSIS_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_ANALYSIS_API_URL;
    process.env.NODE_ENV = "development";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;

    if (originalServerBase === undefined) {
      delete process.env.PDF_ANALYSIS_API_BASE_URL;
    } else {
      process.env.PDF_ANALYSIS_API_BASE_URL = originalServerBase;
    }

    if (originalPublicBase === undefined) {
      delete process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL = originalPublicBase;
    }

    if (originalLegacyBase === undefined) {
      delete process.env.NEXT_PUBLIC_ANALYSIS_API_URL;
    } else {
      process.env.NEXT_PUBLIC_ANALYSIS_API_URL = originalLegacyBase;
    }
  });

  it("prefers server-only base URL over public values", () => {
    process.env.PDF_ANALYSIS_API_BASE_URL = "https://server.example.com/";
    process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL = "https://public.example.com";

    expect(resolvePdfAnalysisApiBaseUrl()).toBe("https://server.example.com");
  });

  it("uses public base URL when server-only value is missing", () => {
    process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL =
      "https://public.example.com/";

    expect(resolvePdfAnalysisApiBaseUrl()).toBe("https://public.example.com");
  });

  it("uses legacy NEXT_PUBLIC_ANALYSIS_API_URL as fallback", () => {
    process.env.NEXT_PUBLIC_ANALYSIS_API_URL = "https://legacy.example.com/";

    expect(resolvePdfAnalysisApiBaseUrl()).toBe("https://legacy.example.com");
  });

  it("falls back to localhost in non-production when no env var is set", () => {
    expect(resolvePdfAnalysisApiBaseUrl()).toBe("http://localhost:8000");
  });

  it("returns empty in production when no env var is set", () => {
    process.env.NODE_ENV = "production";

    expect(resolvePdfAnalysisApiBaseUrl()).toBe("");
  });

  it("strips trailing /api when requested", () => {
    process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL =
      "https://public.example.com/api/";

    expect(resolvePdfAnalysisApiBaseUrl({ stripApiSuffix: true })).toBe(
      "https://public.example.com",
    );
  });
});
