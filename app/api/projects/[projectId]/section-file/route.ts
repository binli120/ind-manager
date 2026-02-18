// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers"

const region = process.env.AWS_REGION ?? "us-east-1"
const defaultBucket = process.env.DOC_REPOSITORY_BUCKET ?? "doc-repository-dev"

const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
})

const ensureSlash = (p: string) => (p ? (p.endsWith("/") ? p : `${p}/`) : "")
const normalizePath = (input: string) => input.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "")
const sectionToFolder = (section: string) => section.replace(/\./g, "/")
const sanitizePathSegment = (input: string) =>
  input
    .trim()
    .replace(/[\\/]/g, " - ")
    .replace(/\s+/g, " ")
const sanitizePath = (input: string) =>
  normalizePath(input)
    .split("/")
    .map(sanitizePathSegment)
    .filter(Boolean)
    .join("/")

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const rateLimited = checkRateLimit({ tier: "write", request: req })
  if (rateLimited) return rateLimited

  const params = await context.params
  const projectId = params.projectId
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
  }

  try {
    const body = (await req.json()) as {
      selectionPath?: string
      selectionTextPath?: string
      selectionType?: "folder" | "file"
      fileName?: string
      company?: string | null
      projectName?: string | null
      s3Key?: string | null
      bucket?: string | null
    }

    const { selectionPath, selectionType, fileName } = body
    if (!selectionPath || !selectionType) {
      return NextResponse.json({ error: "selectionPath and selectionType are required" }, { status: 400 })
    }

    const baseName = sanitizePathSegment(fileName || selectionPath.split("/").pop() || "")
    if (!baseName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 })
    }

    const finalName = baseName.toLowerCase().endsWith(".docx") ? baseName : `${baseName}.docx`

    const bucket = body.bucket || defaultBucket

    const explicitKey = body.s3Key && body.s3Key.startsWith("s3://") ? body.s3Key : null
    const { bucket: parsedBucket, prefix: parsedPrefix } = explicitKey
      ? (() => {
          const without = explicitKey.replace("s3://", "")
          const [b, ...rest] = without.split("/")
          return { bucket: b || bucket, prefix: ensureSlash(rest.join("/")) }
        })()
      : { bucket, prefix: null as string | null }

    const company = body.company?.trim() || process.env.DEFAULT_COMPANY || "company"
    const projectName = body.projectName?.trim() || projectId

    const basePrefix = parsedPrefix ?? ensureSlash(`${company}/${projectName}`)

    const selectionTextNormalized = sanitizePath(body.selectionTextPath || selectionPath)

    const logicalPath = selectionTextNormalized.includes("/")
      ? selectionTextNormalized
      : sectionToFolder(selectionTextNormalized)
    const parentLogical =
      selectionType === "folder" ? logicalPath : logicalPath.split("/").slice(0, -1).join("/")
    const targetFolder = parentLogical ? ensureSlash(parentLogical) : ""
    const finalKey = `${basePrefix}${targetFolder}${finalName}`

    const put = new PutObjectCommand({
      Bucket: parsedBucket,
      Key: finalKey,
      Body: Buffer.from(""),
      ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    await s3Client.send(put)

    return NextResponse.json({ key: `s3://${parsedBucket}/${finalKey}` })
  } catch (error) {
    console.error("[section-file] failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create file" },
      { status: 500 },
    )
  }
}
