import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { Section, SubsectionContent } from "@/types/section";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const IGNORE_SUFFIXES = [".pdf.tables", ".pdf.images"];

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  files: string[];
};

const region = process.env.AWS_REGION ?? "us-east-1";
const defaultBucket =
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

function ensureTrailingSlash(input: string) {
  return input.endsWith("/") ? input : `${input}/`;
}

function parseS3Key(raw?: string) {
  if (!raw || !raw.startsWith("s3://")) return null;
  const without = raw.replace("s3://", "");
  const [bucket, ...rest] = without.split("/");
  const key = rest.join("/");
  return {
    bucket: bucket || defaultBucket,
    prefix: ensureTrailingSlash(key || ""),
  };
}

async function listAllKeys(bucket: string, prefix: string) {
  const keys: string[] = [];
  let continuation: string | undefined;

  do {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuation,
      })
    );

    res.Contents?.forEach((obj) => {
      if (obj.Key) keys.push(obj.Key);
    });

    continuation = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuation);

  return keys;
}

function isAllowedFile(fileName: string) {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function buildTree(keys: string[], prefix: string) {
  const nodes: TreeNode[] = [];
  const rootFiles: string[] = [];

  keys.forEach((key) => {
    if (!key.startsWith(prefix)) return;
    const relative = key.slice(prefix.length);
    if (!relative) return;

    const parts = relative.split("/").filter(Boolean);
    if (!parts.length) return;

    // Skip byproduct ingestion folders like *.pdf.tables, *.pdf.images
    if (parts.some((p) => IGNORE_SUFFIXES.some((suf) => p.endsWith(suf)))) {
      return;
    }

    if (!parts.length) return;

    const isFile = parts[parts.length - 1].includes(".");
    const folders = isFile ? parts.slice(0, -1) : parts;
    const fileName = isFile ? parts[parts.length - 1] : null;

    let parent: TreeNode | null = null;
    let currentList = nodes;
    let currentPath = prefix;

    folders.forEach((folder) => {
      currentPath = ensureTrailingSlash(`${currentPath}${folder}`);
      let node = currentList.find((n) => n.name === folder);
      if (!node) {
        node = {
          name: folder,
          path: currentPath,
          children: [],
          files: [],
        };
        currentList.push(node);
      }
      parent = node;
      currentList = node.children;
    });

    if (fileName) {
      if (isAllowedFile(fileName)) {
        if (parent) {
          (parent as TreeNode).files.push(fileName);
        } else {
          rootFiles.push(fileName);
        }
      }
    }
  });

  return { nodes, rootFiles };
}

function fileToSubsection(
  fileName: string,
  parentPath: string
): SubsectionContent {
  const number = fileName;
  return {
    id: `${parentPath}${fileName}`,
    subsectionNumber: number,
    title: fileName,
    header: fileName,
    // full path for tooltip
    fullPath: `${parentPath}${fileName}`,
    content: "",
    isRequired: false,
    status: "draft",
    isCategory: false,
    isUserAdded: false,
  };
}

function nodeToSubsection(node: TreeNode): SubsectionContent {
  const number = node.name;
  return {
    id: node.path,
    subsectionNumber: number,
    title: node.name,
    header: node.name,
    fullPath: node.path,
    content: "",
    isRequired: false,
    status: "draft",
    isCategory: true,
    isUserAdded: false,
    subsections: [
      ...node.children.map((child) => nodeToSubsection(child)),
      ...node.files.map((file) => fileToSubsection(file, node.path)),
    ],
  };
}

function treeToSections(nodes: TreeNode[], rootFiles: string[], prefix: string): Section[] {
  const sections: Section[] = nodes.map((node) => ({
    id: node.path,
    number: node.name,
    title: node.name,
    parentSection: "",
    isRequired: false,
    status: "draft",
    isCategory: true,
    isUserAdded: false,
    subsections: [
      ...node.children.map((child) => nodeToSubsection(child)),
      ...node.files.map((file) => fileToSubsection(file, node.path)),
    ],
  }));

  if (rootFiles.length) {
    sections.push({
      id: `${prefix}__root__`,
      number: "root-files",
      title: "Root Files",
      parentSection: "",
      isRequired: false,
      status: "draft",
      isCategory: true,
      isUserAdded: false,
      subsections: rootFiles.map((file) =>
        fileToSubsection(file, prefix)
      ),
    });
  }

  return sections;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const params = await context.params;
  const projectId = params.projectId;

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(_req.url);
    const s3Key = url.searchParams.get("s3Key");
    // projectCode currently unused but kept for potential debug
    void url.searchParams.get("projectCode");
    const projectName = url.searchParams.get("projectName");
    const company =
      url.searchParams.get("company") || process.env.DEFAULT_COMPANY || undefined;
    const parsed = parseS3Key(s3Key ?? undefined);

    const bucket = parsed?.bucket ?? defaultBucket;
    if (!parsed?.prefix && (!company || !projectName)) {
      return NextResponse.json(
        {
          error: "Missing company or projectName for S3 prefix",
        },
        { status: 400 }
      );
    }

    const prefix =
      parsed?.prefix ?? ensureTrailingSlash(`${company}/${projectName}`);

    console.log("[sections-api] bucket/prefix", { bucket, prefix });

    const keys = await listAllKeys(bucket, prefix);
    const { nodes, rootFiles } = buildTree(keys, prefix);
    const sections = treeToSections(nodes, rootFiles, prefix);

    return NextResponse.json({
      sections,
      meta: {
        bucket,
        prefix,
        keyCount: keys.length,
      },
    });
  } catch (error) {
    console.error("[sections-api] failed to load tree", error);
    return NextResponse.json(
      {
        error: "Failed to load section tree",
        message:
          error instanceof Error ? error.message : "Unknown S3 error",
      },
      { status: 500 }
    );
  }
}
