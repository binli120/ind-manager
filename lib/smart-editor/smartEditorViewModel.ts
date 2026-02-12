// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import type { Section } from "@/types/section";

type ProjectLike = {
  metadata?: unknown;
  tenantId?: string;
  title?: string;
  code?: string;
  id?: string;
};

type TenantLike = {
  id: string;
  name: string;
};

const getMetadataValue = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }
  const value = (metadata as Record<string, unknown>)[key];
  return value === undefined || value === null ? undefined : String(value);
};

export const deriveSmartEditorContext = ({
  currentProject,
  tenants,
  selectedTenantId,
}: {
  currentProject: ProjectLike | null | undefined;
  tenants: TenantLike[];
  selectedTenantId: string | null | undefined;
}) => {
  const companyFromMetadata = getMetadataValue(currentProject?.metadata, "company");
  const titleFromMetadata = getMetadataValue(currentProject?.metadata, "ind_title");
  const primaryS3Key = getMetadataValue(
    currentProject?.metadata,
    "primaryDocumentS3Key",
  );
  const tenantEntry = tenants.find((tenant) => tenant.id === selectedTenantId);

  const companyValue =
    companyFromMetadata ||
    tenantEntry?.name ||
    currentProject?.tenantId ||
    selectedTenantId ||
    "unknown-company";
  const projectNameValue =
    titleFromMetadata ||
    currentProject?.title ||
    currentProject?.code ||
    currentProject?.id ||
    "unknown-project";

  return {
    companyValue,
    projectNameValue,
    primaryS3Key,
  };
};

export const markdownToHtml = (markdown: string) => {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const escaped = escapeHtml(markdown);
  const blocks = escaped
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");

  return blocks || "<p></p>";
};

export const toSectionNumber = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)*)(?:[^\d.]|$)/);
  return match ? match[1] : null;
};

export const buildTreeCacheKey = (
  projectId: string,
  s3Key?: string,
  company?: string,
  projectName?: string,
) =>
  [
    "sectionTree",
    projectId || "no-project",
    s3Key || "no-s3key",
    company || "no-company",
    projectName || "no-projectName",
  ].join(":");

export const loadCachedTree = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; sections: Section[] };
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - parsed.ts > tenMinutes) return null;
    return parsed.sections;
  } catch {
    return null;
  }
};

export const saveTreeCache = (key: string, sections: Section[]) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), sections }));
  } catch {
    // ignore quota errors
  }
};

export const fetchSectionTree = async ({
  projectId,
  s3Key,
  company,
  projectName,
  signal,
}: {
  projectId: string;
  s3Key?: string;
  company: string;
  projectName: string;
  signal?: AbortSignal;
}) => {
  const url = new URL(`/api/projects/${projectId}/sections`, window.location.origin);
  if (s3Key) {
    url.searchParams.set("s3Key", s3Key);
  }
  url.searchParams.set("company", company);
  url.searchParams.set("projectName", projectName);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(
      errorPayload?.message || errorPayload?.error || "Failed to load section tree",
    );
  }

  const payload = await response.json();
  return (payload?.sections ?? []) as Section[];
};

export const fetchSignedProjectAsset = async <T>({
  projectId,
  key,
  format = "url",
}: {
  projectId: string;
  key: string;
  format?: "url" | "text";
}) => {
  const url = new URL(`/api/projects/${projectId}/asset`, window.location.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("format", format);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`asset api failed ${response.status}`);
  }
  return (await response.json()) as T;
};
