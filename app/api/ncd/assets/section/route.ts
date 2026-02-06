import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

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

const rawBase = process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL;
const cleanedBase =
  rawBase?.replace(/\/+$/, "").replace(/\/api\/?$/i, "") || "http://localhost:8000";
const API_BASE = cleanedBase;

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

const ASSETS_FILE_PATH = path.join(process.cwd(), "assets-section.json");

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
      const imagesRaw = Array.isArray(topicObj.images)
        ? topicObj.images
        : Array.isArray(topicObj.assets)
          ? topicObj.assets
          : [];
      const tablesRaw = Array.isArray(topicObj.tables)
        ? topicObj.tables
        : Array.isArray(topicObj.html_tables)
          ? topicObj.html_tables
          : [];

      const normalizeImage = (img: unknown, i: number): AssetsSectionImage => {
        if (!img || typeof img !== "object") return { id: `img-${tIdx}-${i}` };
        const imgObj = img as Record<string, unknown>;
        return {
          id: typeof imgObj.id === "string" ? imgObj.id : `img-${tIdx}-${i}`,
          title:
            (typeof imgObj.title === "string" && imgObj.title) ||
            (typeof imgObj.caption === "string" && imgObj.caption) ||
            undefined,
          caption: typeof imgObj.caption === "string" ? imgObj.caption : undefined,
          url: typeof imgObj.url === "string" ? imgObj.url : undefined,
        };
      };

      const normalizeTable = (tbl: unknown, i: number): AssetsSectionTable => {
        if (typeof tbl === "string") {
          return { id: `table-${tIdx}-${i}`, html: tbl };
        }
        if (!tbl || typeof tbl !== "object") return { id: `table-${tIdx}-${i}` };
        const tblObj = tbl as Record<string, unknown>;
        const html =
          typeof tblObj.html === "string"
            ? tblObj.html
            : typeof tblObj.table === "string"
              ? tblObj.table
              : undefined;
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
          "",
        images: imagesRaw.map(normalizeImage),
        tables: tablesRaw.map(normalizeTable),
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
  try {
    const raw = await fs.readFile(ASSETS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeDocuments(parsed);
  } catch (error) {
    console.warn("[ncd-assets-section] local assets-section.json unavailable; using fallback", error);
    return null;
  }
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
  resp.headers.set("x-proxy-target", `${API_BASE}/ncd/assets/section`);
  return resp;
}

