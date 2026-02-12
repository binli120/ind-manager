// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { NextRequest, NextResponse } from "next/server";
import { resolvePdfAnalysisApiBaseUrl } from "@/lib/common/pdfAnalysisApiBaseUrl";

const API_BASE = resolvePdfAnalysisApiBaseUrl({ stripApiSuffix: true });
const DEFAULT_BUCKET =
  process.env.DOC_REPOSITORY_BUCKET ||
  process.env.NEXT_PUBLIC_DOC_REPOSITORY_BUCKET ||
  "doc-repository-dev";
const DEFAULT_AWS_REGION = process.env.AWS_REGION || "us-east-1";

export async function POST(req: NextRequest) {
  try {
    if (!API_BASE) {
      return NextResponse.json(
        {
          error:
            "PDF analysis API base URL is not configured. Set PDF_ANALYSIS_API_BASE_URL or NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL.",
        },
        { status: 500 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const tenantName =
      typeof body.tenant_name === "string" ? body.tenant_name.trim() : "";
    const projectName =
      typeof body.project_name === "string" ? body.project_name.trim() : "";

    if (!tenantName) {
      return NextResponse.json(
        { error: "tenant_name is required" },
        { status: 400 },
      );
    }
    if (!projectName) {
      return NextResponse.json(
        { error: "project_name is required" },
        { status: 400 },
      );
    }

    const payload = {
      bucket:
        typeof body.bucket === "string" && body.bucket.trim()
          ? body.bucket.trim()
          : DEFAULT_BUCKET,
      tenant_name: tenantName,
      project_name: projectName,
      aws_region:
        typeof body.aws_region === "string" && body.aws_region.trim()
          ? body.aws_region.trim()
          : DEFAULT_AWS_REGION,
    };

    const targetUrl = `${API_BASE}/s3/new-project`;
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!response.ok) {
      const errorBody = NextResponse.json(
        {
          error:
            (data as { error?: string; message?: string })?.error ||
            (data as { error?: string; message?: string })?.message ||
            "Upstream error",
          status: response.status,
          upstreamBody: data,
        },
        { status: response.status },
      );
      errorBody.headers.set("x-proxy-target", targetUrl);
      return errorBody;
    }

    const successBody = NextResponse.json(data, { status: response.status });
    successBody.headers.set("x-proxy-target", targetUrl);
    return successBody;
  } catch (error) {
    console.error("[s3-new-project] failed", error);
    return NextResponse.json(
      { error: "Failed to create S3 folder structure for project" },
      { status: 500 },
    );
  }
}
