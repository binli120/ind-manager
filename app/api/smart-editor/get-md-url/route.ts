import { NextResponse } from "next/server";
import { s3Client, requiredBucket } from "@/lib/smart-editor/s3-client";
import { GetObjectCommand } from "@aws-sdk/client-s3";

async function bodyToString(body: any): Promise<string> {
  if (body?.transformToByteArray) {
    const bytes = await body.transformToByteArray();
    return new TextDecoder().decode(bytes);
  }
  return await body.text?.();
}

export async function GET(req: Request) {
  try {
    const fileKey = new URL(req.url).searchParams.get("fileKey");
    if (!fileKey) return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });

    const { Body } = await s3Client.send(
      new GetObjectCommand({ Bucket: requiredBucket, Key: fileKey })
    );

    const content = await bodyToString(Body);
    return NextResponse.json({ success: true, content });
  } catch (err) {
    console.error("Markdown fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch markdown file" }, { status: 500 });
  }
}
