export type LabelCandidate = {
  section_number: string;
  section_title?: string;
  score?: number;
};

export type LabelUploadResponse = {
  section_number?: string;
  section_title?: string;
  confidence?: number;
  method?: string;
  pages_sampled?: number;
  candidates?: LabelCandidate[];
};

/**
 * Call the local relabeling service running at http://localhost:8080/ncd/label-upload
 * with a multipart/form-data upload.
 */
export async function labelUploadedDocument(
  file: File,
  options: { page_limit?: number; use_llm?: boolean; signal?: AbortSignal } = {}
): Promise<LabelUploadResponse> {
  const { page_limit = 5, use_llm = false, signal } = options;

  const baseUrl =
    process.env.NEXT_PUBLIC_ANALYSIS_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.filynai.com"
      : "http://localhost:8000");

  const form = new FormData();
  form.append("file", file);
  form.append("page_limit", String(page_limit));
  form.append("use_llm", String(use_llm));

  const res = await fetch(`${baseUrl}/ncd/label-upload`, {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`label-upload failed ${res.status}: ${text}`);
  }

  return (await res.json()) as LabelUploadResponse;
}
