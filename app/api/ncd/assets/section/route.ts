import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { resolvePdfAnalysisApiBaseUrl } from "@/lib/common/pdfAnalysisApiBaseUrl";

interface AssetsSectionImage {
  id?: string;
  title?: string;
  caption?: string;
  url?: string;
}

interface AssetsSectionTable {
  id?: string;
  title?: string;
  headers?: string[];
  rows?: string[][];
  html?: string;
}

interface AssetsSectionTopic {
  id?: string;
  title?: string;
  content?: string;
  images?: AssetsSectionImage[];
  tables?: AssetsSectionTable[];
}

interface AssetsSectionDocument {
  id?: string;
  name?: string;
  section?: string;
  topics?: AssetsSectionTopic[];
}

interface AssetsSectionResponse {
  section?: string;
  documents: AssetsSectionDocument[];
  metadata?: Record<string, unknown> | null;
  source?: string;
}

const API_BASE = resolvePdfAnalysisApiBaseUrl({ stripApiSuffix: true });

const DEFAULT_TENANT = "c38daae8-07a8-4da4-9a68-9a9955b09f70";
const DEFAULT_PROJECT = "2b44ecab-45c8-4105-b4ae-e9b7080bb4d6";
const DEFAULT_SECTION = "4";

const FALLBACK_ASSETS: AssetsSectionResponse = {
  section: DEFAULT_SECTION,
  documents: [
    {
      id: "fallback-doc",
      name: "Sample Module 4 Materials",
      section: "4",
      topics: [
        {
          id: "fallback-topic",
          title: "Example topic",
          content:
            "Replace assets-section.json with the upstream API payload. This fallback exists so the UI can render even without the upstream service.",
          images: [],
          tables: [],
        },
      ],
    },
  ],
  metadata: { source: "fallback" },
};

const ASSETS_FILE_PATHS = [
  path.join(process.cwd(), "assets-section.json"),
  path.join(process.cwd(), "assets_section.json"),
];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const resolveImageUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const direct =
    asString(obj.url) ||
    asString(obj.download_url) ||
    asString(obj.downloadUrl) ||
    asString(obj.file_url) ||
    asString(obj.fileUrl) ||
    asString(obj.image_url) ||
    asString(obj.imageUrl) ||
    asString(obj.s3_url) ||
    asString(obj.s3Url);
  if (direct) return direct;
  const nestedKeys = ["file", "asset", "source", "image", "data"];
  for (const key of nestedKeys) {
    const nested = obj[key];
    if (nested && typeof nested === "object") {
      const nestedObj = nested as Record<string, unknown>;
      const nestedUrl =
        asString(nestedObj.url) ||
        asString(nestedObj.download_url) ||
        asString(nestedObj.downloadUrl) ||
        asString(nestedObj.file_url) ||
        asString(nestedObj.fileUrl) ||
        asString(nestedObj.image_url) ||
        asString(nestedObj.imageUrl) ||
        asString(nestedObj.s3_url) ||
        asString(nestedObj.s3Url);
      if (nestedUrl) return nestedUrl;
    }
  }
  return undefined;
};

const resolveTableHtml = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  return (
    asString(obj.html) ||
    asString(obj.table) ||
    asString(obj.html_table) ||
    asString(obj.htmlTable) ||
    asString(obj.html_table_html) ||
    asString(obj.htmlTableHtml)
  );
};

const hasTableSignature = (value: unknown): boolean => {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower.includes("<table") || lower.includes("<tr") || lower.includes("<td");
  }
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const type = asString(obj.type) ?? asString(obj.asset_type);
  if (type && type.toLowerCase().includes("table")) return true;
  return (
    Boolean(resolveTableHtml(obj)) ||
    Array.isArray(obj.headers) ||
    Array.isArray(obj.rows)
  );
};

const hasImageSignature = (value: unknown): boolean => {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return /\.(png|jpe?g|gif|bmp|webp|svg)(\?.*)?$/.test(lower);
  }
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const type = asString(obj.type) ?? asString(obj.asset_type);
  if (type && (type.toLowerCase().includes("image") || type.toLowerCase().includes("figure"))) return true;
  return Boolean(resolveImageUrl(obj));
};

const splitAssets = (assets: unknown[]) => {
  const imageAssets: unknown[] = [];
  const tableAssets: unknown[] = [];
  for (const asset of assets) {
    if (hasTableSignature(asset)) {
      tableAssets.push(asset);
      continue;
    }
    if (hasImageSignature(asset)) {
      imageAssets.push(asset);
    }
  }
  return { imageAssets, tableAssets };
};

const normalizeDocuments = (payload: unknown): AssetsSectionResponse => {
  if (!payload || typeof payload !== "object") return FALLBACK_ASSETS;

  const obj = payload as Record<string, unknown>;
  const documentsRaw = Array.isArray(obj.documents) ? obj.documents : [];

  const documents: AssetsSectionDocument[] = documentsRaw.map((doc, idx) => {
    const docObj = (doc || {}) as Record<string, unknown>;
    const topicsRaw = Array.isArray(docObj.topics) ? docObj.topics : [];

    const topics: AssetsSectionTopic[] = topicsRaw.map((topic, tIdx) => {
      if (!topic || typeof topic !== "object") return {};
      const topicObj = topic as Record<string, unknown>;
      const imagesRaw = Array.isArray(topicObj.images) ? topicObj.images : [];
      const assetsObj =
        topicObj.assets && typeof topicObj.assets === "object" && !Array.isArray(topicObj.assets)
          ? (topicObj.assets as Record<string, unknown>)
          : null;
      const assetsImagesRaw = Array.isArray(assetsObj?.images) ? assetsObj?.images ?? [] : [];
      const assetsTablesRaw = Array.isArray(assetsObj?.tables) ? assetsObj?.tables ?? [] : [];
      const assetsRaw = Array.isArray(topicObj.assets) ? topicObj.assets : [];
      const tablesRaw = Array.isArray(topicObj.tables) ? topicObj.tables : [];
      const htmlTablesRaw = Array.isArray(topicObj.html_tables)
        ? topicObj.html_tables
        : Array.isArray(topicObj.htmlTables)
          ? topicObj.htmlTables
          : topicObj.htmlTable || topicObj.html_table
            ? [topicObj.htmlTable ?? topicObj.html_table]
            : [];
      const { imageAssets, tableAssets } = splitAssets(assetsRaw);
      const imageInputs = [...imagesRaw, ...assetsImagesRaw, ...imageAssets];
      const tableInputs = [...tablesRaw, ...assetsTablesRaw, ...tableAssets, ...htmlTablesRaw];

      const normalizeImage = (img: unknown, i: number): AssetsSectionImage => {
        if (typeof img === "string") {
          return { id: `img-${tIdx}-${i}`, url: img };
        }
        if (!img || typeof img !== "object") return { id: `img-${tIdx}-${i}` };
        const imgObj = img as Record<string, unknown>;
        const url = resolveImageUrl(imgObj);
        return {
          id: typeof imgObj.id === "string" ? imgObj.id : `img-${tIdx}-${i}`,
          title:
            (typeof imgObj.title === "string" && imgObj.title) ||
            (typeof imgObj.caption === "string" && imgObj.caption) ||
            (typeof imgObj.name === "string" && imgObj.name) ||
            undefined,
          caption: typeof imgObj.caption === "string" ? imgObj.caption : undefined,
          url,
        };
      };

      const normalizeTable = (tbl: unknown, i: number): AssetsSectionTable => {
        if (typeof tbl === "string") {
          return { id: `table-${tIdx}-${i}`, html: tbl };
        }
        if (!tbl || typeof tbl !== "object") return { id: `table-${tIdx}-${i}` };
        const tblObj = tbl as Record<string, unknown>;
        const html = resolveTableHtml(tblObj);
        return {
          id: typeof tblObj.id === "string" ? tblObj.id : `table-${tIdx}-${i}`,
          title: typeof tblObj.title === "string" ? tblObj.title : undefined,
          headers: Array.isArray(tblObj.headers)
            ? (tblObj.headers as unknown[]).map((h) => String(h))
            : undefined,
          rows: Array.isArray(tblObj.rows)
            ? (tblObj.rows as unknown[])
                .filter((row) => Array.isArray(row))
                .map((row) => (row as unknown[]).map((cell) => String(cell)))
            : undefined,
          html,
        };
      };

      return {
        id:
          (typeof topicObj.id === "string" && topicObj.id) ||
          (typeof topicObj.topic_id === "string" && topicObj.topic_id) ||
          `topic-${idx}-${tIdx}`,
        title:
          (typeof topicObj.title === "string" && topicObj.title) ||
          (typeof topicObj.topic === "string" && topicObj.topic) ||
          `Topic ${tIdx + 1}`,
        content:
          (typeof topicObj.content === "string" && topicObj.content) ||
          (typeof topicObj.text === "string" && topicObj.text) ||
          (typeof topicObj.description === "string" && topicObj.description) ||
          (typeof topicObj.summary === "string" && topicObj.summary) ||
          "",
        images: imageInputs.map(normalizeImage),
        tables: tableInputs.map(normalizeTable),
      };
    });

    return {
      id: (typeof docObj.id === "string" && docObj.id) || `doc-${idx}`,
      name:
        (typeof docObj.name === "string" && docObj.name) ||
        (typeof docObj.document_name === "string" && docObj.document_name) ||
        (typeof docObj.title === "string" && docObj.title) ||
        `Document ${idx + 1}`,
      section: typeof docObj.section === "string" ? docObj.section : undefined,
      topics,
    };
  });

  return {
    section: typeof obj.section === "string" ? obj.section : undefined,
    documents,
    metadata:
      obj.metadata && typeof obj.metadata === "object"
        ? (obj.metadata as Record<string, unknown>)
        : null,
    source: typeof obj.source === "string" ? obj.source : undefined,
  };
};

const readLocalAssets = async (): Promise<AssetsSectionResponse | null> => {
  for (const filePath of ASSETS_FILE_PATHS) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      return normalizeDocuments(parsed);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      }
      console.warn(`[ncd-assets-section] failed to read ${filePath}; using fallback`, error);
      return null;
    }
  }
  console.warn("[ncd-assets-section] local assets-section.json unavailable; using fallback");
  return null;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get("tenant_id")?.trim() || DEFAULT_TENANT;
  const projectId = searchParams.get("project_id")?.trim() || DEFAULT_PROJECT;
  const section =
    searchParams.get("section")?.trim() ||
    searchParams.get("section_number")?.trim() ||
    DEFAULT_SECTION;

  if (!section) {
    return NextResponse.json({ error: "section is required" }, { status: 400 });
  }

  // Prefer local JSON stub; fall back to baked-in sample.
  const local = await readLocalAssets();
  const payload = local ?? FALLBACK_ASSETS;

  const responseBody: AssetsSectionResponse & {
    tenant_id: string;
    project_id: string;
    section: string;
  } = {
    tenant_id: tenantId,
    project_id: projectId,
    section,
    documents: payload.documents,
    metadata: payload.metadata ?? null,
    source: payload.source ?? (local ? "local-file" : "fallback"),
  };

  // If an upstream base URL exists, include a hint so the client can trace provenance.
  const resp = NextResponse.json(responseBody, { status: 200 });
  resp.headers.set("x-assets-section-source", responseBody.source || "unknown");
  if (API_BASE) {
    resp.headers.set("x-proxy-target", `${API_BASE}/ncd/assets/section`);
  }
  return resp;
}
