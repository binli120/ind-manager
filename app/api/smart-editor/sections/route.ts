import {
  GetObjectCommand,
  ListObjectsV2Command,
  type _Object,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { s3Client, requiredBucket } from '@/lib/smart-editor/s3-client';
import { Readable } from 'node:stream';
import type {
  StoredDocumentMetadata,
  StoredDocumentWithUrl,
} from '@/lib/smart-editor/document-metadata';

export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

const streamToString = async (body: unknown): Promise<string> => {
  if (!body) {
    return '';
  }

  if (body instanceof Readable) {
    return await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      body.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      body.on('error', reject);
      body.on('end', () =>
        resolve(Buffer.concat(chunks).toString('utf-8'))
      );
    });
  }

  if (typeof (body as Blob).text === 'function') {
    return await (body as Blob).text();
  }

  throw new Error('Unsupported stream type');
};

const listAllPrefixes = async (bucket: string, basePrefix = ''): Promise<string[]> => {
  const prefixes = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Delimiter: '/',
      Prefix: basePrefix ? basePrefix.replace(/\/?$/, '/') : undefined,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);
    response.CommonPrefixes?.forEach((prefix) => {
      if (prefix?.Prefix) {
        prefixes.add(prefix.Prefix.replace(/\/$/, ''));
      }
    });

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return Array.from(prefixes);
};

const readJsonObject = async <T>(bucket: string, key: string): Promise<T> => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const json = await streamToString(response.Body);
  return JSON.parse(json) as T;
};

function inferDocumentType(filename: string): StoredDocumentMetadata["type"] {
  const lower = filename.toLowerCase();

  //Add more to this
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".txt")) return "text";

  return "file";
}

const isAllowedFile = (name: string) => {
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  );
};

const listSectionDocuments = async (
  bucket: string,
  sectionId: string
) => {
  const documents: StoredDocumentMetadata[] = [];
  const metaFileKeys = new Map<string, StoredDocumentMetadata>();
  const nonMetaFileKeys = [];
  let continuationToken: string | undefined;

  const leaf = (k: string) => k.split("/").filter(Boolean).pop()!;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${sectionId}/`,
      Delimiter: "/",
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    // folders and subfolders
    for (const cp of response.CommonPrefixes ?? []) {
      const folderPath = cp.Prefix!.replace(/\/$/, "");
      const folderName = leaf(folderPath);

      documents.push({
        id: folderPath,
        sectionId,
        sectionName: leaf(sectionId),
        title: folderName,
        type: "folder",
        tags: [],
        fileKey: folderPath,
        originalFileName: folderName,
        originalPath: folderPath,
      });
    }

    // files
    for (const item of response.Contents ?? []) {
      const key = item.Key!;
      if (key.endsWith("/")) continue;

      if (key.endsWith("metadata.json")) {
        try {
          const metadata = await readJsonObject<StoredDocumentMetadata>(bucket, key);
          const fileKey = metadata.fileKey ?? "";
          const filename = leaf(fileKey || key);

          if (!isAllowedFile(filename)) continue;

          metaFileKeys.set(fileKey || key, {
            ...metadata,
            sectionId,
            sectionName: leaf(sectionId),
            title: filename,
            originalFileName: filename,
            originalPath: fileKey || key,
            type: inferDocumentType(filename),
          });
        } catch (e) {
          console.error(`Failed to parse ${key}:`, e);
        }
      } else {
        nonMetaFileKeys.push(item);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  // add metadata defined documents
  documents.push(...metaFileKeys.values());

  // add non-metadata
  for (const item of nonMetaFileKeys) {
    const key = item.Key!;
    if (metaFileKeys.has(key)) continue;

    const filename = leaf(key);

    if (!isAllowedFile(filename)) continue;

    documents.push({
      id: key,
      sectionId,
      sectionName: leaf(sectionId),
      title: filename,
      type: inferDocumentType(filename),
      tags: [],
      fileKey: key,
      originalFileName: filename,
      originalPath: key,
      uploadedAt: item.LastModified?.toISOString(),
    });
  }

  return documents;
};

const applySignedUrls = async (
  bucket: string,
  documents: StoredDocumentMetadata[]
) => {
  return await Promise.all(
    documents.map(async (doc) => {
      let signedUrl: string | null = null;
      if (doc.fileKey && doc.type !== 'folder') {
        signedUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: doc.fileKey,
          }),
          { expiresIn: SIGNED_URL_TTL_SECONDS }
        );
      }

      const contentWithSignedUrl =
        signedUrl && doc.content
          ? doc.content.replace(
              new RegExp(`data-src=["']s3key:${doc.fileKey}["']`, 'g'),
              `data-src="${signedUrl}"`
            )
          : doc.content;

      return {
        ...doc,
        fileUrl: signedUrl,
        content: contentWithSignedUrl,
      } satisfies StoredDocumentWithUrl;
    })
  );
};

export async function GET(req: Request) {
  try {
    if (!requiredBucket) {
      return NextResponse.json(
        { error: 'AWS_S3_BUCKET is not configured on the server.' },
        { status: 500 }
      );
    }

    //Handle listing the content of a folder
    const url = new URL(req.url);
    const prefixParam = url.searchParams.get('prefix');
    const leaf = (k: string) => k.split("/").filter(Boolean).pop()!;

    //handles if there is a prefix
    if (prefixParam) {
      const prefix = prefixParam.replace(/\/+$/, '');
      const docs = await listSectionDocuments(requiredBucket, prefix);
      const docsWithUrls = await applySignedUrls(requiredBucket, docs);

      return NextResponse.json({
        sections: [
          {
            id: prefix,
            name: leaf(prefix),
            expanded: true,
            documents: docsWithUrls,
          },
        ],
      });
    }

    const prefixes = await listAllPrefixes(requiredBucket, 'filynai.com');

    const sections = [];
    for (const sectionId of prefixes) {
      let sectionName = sectionId;
      try {
        const metadata = await readJsonObject<{ name?: string }>(
          requiredBucket,
          `${sectionId}/section.json`
        );
        if (metadata?.name) {
          sectionName = metadata.name;
        }
      } catch (error) {
        console.warn(
          `[sections] No section metadata for ${sectionId}:`,
          error instanceof Error ? error.message : error
        );
      }

      const documents = await listSectionDocuments(
        requiredBucket,
        sectionId
      );

      const documentsWithUrls = await applySignedUrls(
        requiredBucket,
        documents
      );

      documentsWithUrls.sort((a, b) => {
        const timeA = a.uploadedAt ? Date.parse(a.uploadedAt) : 0;
        const timeB = b.uploadedAt ? Date.parse(b.uploadedAt) : 0;
        return timeB - timeA;
      });

      sections.push({
        id: sectionId,
        name: sectionName,
        expanded: sections.length === 0,
        documents: documentsWithUrls,
      });
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Failed to fetch sections from S3:', error);
    return NextResponse.json(
      { error: 'Failed to load sections from storage.' },
      { status: 500 }
    );
  }
}
