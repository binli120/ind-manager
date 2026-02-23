// Author: Bin Lee
// Email: binlee120@gmail.com

import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit-helpers";

const region = process.env.AWS_REGION ?? "us-east-1";
const bucket =
  process.env.DOC_REPOSITORY_BUCKET ??
  "doc-repository-dev";

const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const rateLimited = checkRateLimit({ tier: "read", request: req });
  if (rateLimited) return rateLimited;

  void (await context.params); // currently unused but keeps signature consistent

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const format = url.searchParams.get("format") || "url";
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    // Ensure object exists
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (format === "text") {
      const obj = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      const body: unknown = obj.Body;
      const text =
        body && typeof (body as { transformToString?: unknown }).transformToString === "function"
          ? await (body as { transformToString: (enc: string) => Promise<string> }).transformToString("utf-8")
          : "";
      return NextResponse.json({ text });
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn: 900 }
    );

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("[asset-api] failed to sign url", key, error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
