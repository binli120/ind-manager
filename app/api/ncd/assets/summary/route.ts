// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { NextRequest, NextResponse } from "next/server"
import { resolvePdfAnalysisApiBaseUrl } from "@/lib/common/pdfAnalysisApiBaseUrl"
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers"

const API_BASE = resolvePdfAnalysisApiBaseUrl({ stripApiSuffix: true })
const DEFAULT_BUCKET =
  process.env.DOC_REPOSITORY_BUCKET ||
  process.env.NEXT_PUBLIC_DOC_REPOSITORY_BUCKET ||
  "doc-repository-dev"
const DEFAULT_TENANT = "c38daae8-07a8-4da4-9a68-9a9955b09f70"
const DEFAULT_PROJECT = "2b44ecab-45c8-4105-b4ae-e9b7080bb4d6"

export async function POST(req: NextRequest) {
  const rateLimited = checkRateLimit({ tier: "write", request: req })
  if (rateLimited) return rateLimited

  try {
    if (!API_BASE) {
      return NextResponse.json(
        {
          error:
            "PDF analysis API base URL is not configured. Set PDF_ANALYSIS_API_BASE_URL or NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL.",
        },
        { status: 500 },
      )
    }

    const body = (await req.json()) as Record<string, unknown>

    const payload = {
      section: body.section ?? "",
      tenant_id:
        typeof body.tenant_id === "string" && body.tenant_id.trim()
          ? body.tenant_id.trim()
          : DEFAULT_TENANT,
      project_id:
        typeof body.project_id === "string" && body.project_id.trim()
          ? body.project_id.trim()
          : DEFAULT_PROJECT,
      bucket:
        typeof body.bucket === "string" && body.bucket.trim()
          ? body.bucket.trim()
          : DEFAULT_BUCKET,
      user_prompt: typeof body.user_prompt === "string" ? body.user_prompt : "",
      user_comment: typeof body.user_comment === "string" ? body.user_comment : "",
      previous_summary_id:
        typeof body.previous_summary_id === "string" && body.previous_summary_id.trim()
          ? body.previous_summary_id.trim()
          : null,
      refresh_template:
        typeof body.refresh_template === "boolean" ? body.refresh_template : true,
    }

    if (!payload.section) {
      return NextResponse.json(
        { error: "section is required" },
        { status: 400 },
      )
    }

    const targetUrl = `${API_BASE}/ncd/assets/summary`

    const reqInit: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }

    console.info("[ncd-assets-summary] proxying", {
      method: reqInit.method,
      url: targetUrl,
      payload,
    })

    const res = await fetch(targetUrl, reqInit)

    const raw = await res.text()
    let data: unknown = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = raw
    }

    if (!res.ok) {
      const resp = NextResponse.json(
        {
          error:
            (data as { error?: string; message?: string })?.error ||
            (data as { error?: string; message?: string })?.message ||
            "Upstream error",
          status: res.status,
          upstreamBody: data,
        },
        { status: res.status },
      )
      resp.headers.set("x-proxy-target", targetUrl)
      return resp
    }

    const resp = NextResponse.json(data, { status: res.status })
    resp.headers.set("x-proxy-target", targetUrl)
    return resp
  } catch (error) {
    console.error("[ncd-assets-summary] failed", error)
    return NextResponse.json(
      { error: "Failed to create section summary" },
      { status: 500 },
    )
  }
}
