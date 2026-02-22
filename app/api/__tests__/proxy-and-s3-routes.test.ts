import type { NextRequest } from "next/server";
import { promises as fs } from "fs";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";
import { resolvePdfAnalysisApiBaseUrl } from "@/lib/common/pdfAnalysisApiBaseUrl";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      const headerMap = new Map<string, string>();
      return {
        status: init?.status ?? 200,
        json: async () => body,
        headers: {
          set: (key: string, value: string) => {
            headerMap.set(key.toLowerCase(), value);
          },
          get: (key: string) => headerMap.get(key.toLowerCase()) ?? null,
        },
      };
    },
  },
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("@/lib/rate-limit/rate-limit-helpers", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/lib/common/pdfAnalysisApiBaseUrl", () => ({
  resolvePdfAnalysisApiBaseUrl: jest.fn(() => "https://pdf-analysis.example.com"),
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn((input) => ({ __type: "GetObjectCommand", input })),
  HeadObjectCommand: jest.fn((input) => ({ __type: "HeadObjectCommand", input })),
  PutObjectCommand: jest.fn((input) => ({ __type: "PutObjectCommand", input })),
  ListObjectsV2Command: jest.fn((input) => ({ __type: "ListObjectsV2Command", input })),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

import * as mockProjectsRoute from "@/app/api/mock/projects/route";
import * as newProjectRoute from "@/app/api/s3/new-project/route";
import * as ncdSummaryRoute from "@/app/api/ncd/assets/summary/route";
import * as ncdSectionRoute from "@/app/api/ncd/assets/section/route";
import * as projectAssetRoute from "@/app/api/projects/[projectId]/asset/route";
import * as sectionFileRoute from "@/app/api/projects/[projectId]/section-file/route";
import * as sectionsRoute from "@/app/api/projects/[projectId]/sections/route";

const mockReadFile = fs.readFile as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockResolvePdfAnalysisApiBaseUrl = resolvePdfAnalysisApiBaseUrl as jest.Mock;
const mockGetSignedUrl = getSignedUrl as jest.Mock;

const makeRequest = ({
  url = "http://localhost:3000/api/test",
  body,
}: {
  url?: string;
  body?: unknown;
} = {}) =>
  ({
    url,
    nextUrl: new URL(url),
    json: async () => body,
  }) as unknown as NextRequest;

describe("API proxy/S3 route coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockReturnValue(null);
    mockResolvePdfAnalysisApiBaseUrl.mockReturnValue("https://pdf-analysis.example.com");
    mockGetSignedUrl.mockResolvedValue("https://signed.example.com/object");
    delete process.env.DEFAULT_COMPANY;
  });

  it("covers mock/projects GET", async () => {
    const response = await mockProjectsRoute.GET(
      makeRequest({ url: "http://localhost:3000/api/mock/projects" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.data)).toBe(true);
  });

  it("covers s3/new-project validation failure", async () => {
    const response = await newProjectRoute.POST(
      makeRequest({
        body: { project_name: "Project One" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("tenant_name is required");
  });

  it("covers ncd/assets/summary validation failure", async () => {
    const response = await ncdSummaryRoute.POST(
      makeRequest({
        body: {},
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("section is required");
  });

  it("covers ncd/assets/section fallback behavior", async () => {
    const enoent = Object.assign(new Error("not found"), { code: "ENOENT" });
    mockReadFile.mockRejectedValue(enoent);

    const response = await ncdSectionRoute.GET(
      makeRequest({ url: "http://localhost:3000/api/ncd/assets/section?section=4" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.documents)).toBe(true);
    expect(response.headers.get("x-assets-section-source")).toBeTruthy();
  });

  it("covers projects/[projectId]/asset missing key", async () => {
    const response = await projectAssetRoute.GET(
      makeRequest({ url: "http://localhost:3000/api/projects/p1/asset" }),
      { params: Promise.resolve({ projectId: "p1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Missing key");
  });

  it("covers projects/[projectId]/section-file validation failure", async () => {
    const response = await sectionFileRoute.POST(
      makeRequest({
        body: {
          selectionPath: "4.2.1.3",
          fileName: "new-file",
        },
      }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("selectionPath and selectionType are required");
  });

  it("covers projects/[projectId]/sections missing S3 prefix inputs", async () => {
    const response = await sectionsRoute.GET(
      makeRequest({ url: "http://localhost:3000/api/projects/project-1/sections" }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Missing company or projectName for S3 prefix");
  });
});
