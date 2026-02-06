const DEFAULT_BUCKET =
  process.env.NEXT_PUBLIC_DOC_REPOSITORY_BUCKET || "doc-repository-dev";

const apiBase =
  process.env.NEXT_PUBLIC_ANALYSIS_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.filynai.com"
    : "http://localhost:8000");

export type UploadAnalyzeResponse = Record<string, unknown>;

export async function uploadDocumentToS3(
  file: File,
  params: {
    company: string;
    project: string;
    folder?: string;
    bucket?: string;
    wait_for_completion?: boolean;
  },
  signal?: AbortSignal
): Promise<UploadAnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", params.bucket || DEFAULT_BUCKET);
  form.append("company", params.company);
  form.append("project", params.project);
  if (params.folder) form.append("folder", params.folder);
  if (params.wait_for_completion !== undefined) {
    form.append("wait_for_completion", String(params.wait_for_completion));
  }

  console.log("[uploadDocumentToS3] request", {
    url: `${apiBase}/s3/upload-analyze`,
    bucket: params.bucket || DEFAULT_BUCKET,
    company: params.company,
    project: params.project,
    folder: params.folder,
  });

  const res = await fetch(`${apiBase}/s3/upload-analyze`, {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[uploadDocumentToS3] failed", res.status, text);
    throw new Error(`upload-analyze failed ${res.status}: ${text}`);
  }

  const json = (await res.json().catch(() => ({}))) as UploadAnalyzeResponse;
  console.log("[uploadDocumentToS3] success", json);
  return json;
}
