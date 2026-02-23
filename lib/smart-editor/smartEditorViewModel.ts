// Author: Bin Lee
// Email: binlee120@gmail.com

import type { Section, SubsectionContent } from "@/types/section";
import { z } from "zod";

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
    const parsed = z
      .object({
        ts: z.number(),
        sections: z.array(z.unknown()),
      })
      .parse(JSON.parse(raw));
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - parsed.ts > tenMinutes) return null;
    return sectionRowsSchema.parse(parsed.sections) as Section[];
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

  const payload = sectionTreePayloadSchema.parse(await response.json());
  return payload.sections;
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
  const payload = await response.json();
  if (format === "url") {
    return signedAssetUrlPayloadSchema.parse(payload) as T;
  }
  return signedAssetTextPayloadSchema.parse(payload) as T;
};

const subsectionRowSchema: z.ZodType<SubsectionContent> = z.lazy(() =>
  z.object({
    id: z.string(),
    subsectionNumber: z.string(),
    title: z.string(),
    header: z.string(),
    content: z.string(),
    isRequired: z.boolean(),
    status: z.enum(["draft", "accepted"]),
    isCategory: z.boolean().optional(),
    subsections: z.array(subsectionRowSchema).optional(),
    isUserAdded: z.boolean().optional(),
    fullPath: z.string().optional(),
    templateType: z.enum(["folder", "file"]).optional(),
    description: z.string().optional(),
    templateText: z.string().optional(),
    templateDepth: z.number().optional(),
  }),
);

const sectionRowSchema: z.ZodType<Section> = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  parentSection: z.string(),
  isRequired: z.boolean(),
  status: z.enum(["draft", "accepted", "in-review", "approved"]),
  isCategory: z.boolean().optional(),
  isUserAdded: z.boolean().optional(),
  subsections: z.array(subsectionRowSchema).optional(),
  templateType: z.enum(["folder", "file"]).optional(),
  description: z.string().optional(),
  templateText: z.string().optional(),
  templateDepth: z.number().optional(),
});

const sectionRowsSchema = z.array(sectionRowSchema);

const sectionTreePayloadSchema = z.object({
  sections: sectionRowsSchema,
});

const signedAssetUrlPayloadSchema = z.object({
  url: z.string().url(),
});

const signedAssetTextPayloadSchema = z.object({
  text: z.string().optional(),
});
