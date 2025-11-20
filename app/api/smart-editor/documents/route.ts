import {
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type {
  StoredDocumentMetadata,
  StoredDocumentWithUrl,
} from '@/lib/smart-editor/document-metadata';
import { s3Client, requiredBucket } from '@/lib/smart-editor/s3-client';

export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

const normaliseSectionId = (sectionId: string) =>
  sectionId.replace(/^[/.]+/, '').replace(/\/+$/, '');

const coerceArrayOfStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item == null) return null;
        return String(item);
      })
      .filter((item): item is string => Boolean(item?.trim()))
      .map((item) => item.trim());
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const replacePdfEmbedWithPlaceholder = (
  content: string | null | undefined,
  fileKey: string
): string | null | undefined => {
  if (!content) {
    return content;
  }

  return content.replace(
    /data-src=(["'])data:[^"']*\1/gi,
    `data-src="s3key:${fileKey}"`
  );
};

export async function POST(request: Request) {
  try {
    if (!requiredBucket) {
      return NextResponse.json(
        { error: 'AWS_S3_BUCKET is not configured on the server.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided.' },
        { status: 400 }
      );
    }

    const sectionIdRaw = formData.get('sectionId');
    const sectionNameRaw = formData.get('sectionName');
    const metadataRaw = formData.get('metadata');

    if (typeof sectionIdRaw !== 'string' || !sectionIdRaw.trim()) {
      return NextResponse.json(
        { error: 'sectionId is required.' },
        { status: 400 }
      );
    }

    if (typeof sectionNameRaw !== 'string' || !sectionNameRaw.trim()) {
      return NextResponse.json(
        { error: 'sectionName is required.' },
        { status: 400 }
      );
    }

    const sectionId = normaliseSectionId(sectionIdRaw.trim());
    const sectionName = sectionNameRaw.trim();

    let metadataPayload: Record<string, unknown> = {};
    if (typeof metadataRaw === 'string' && metadataRaw.trim()) {
      try {
        metadataPayload = JSON.parse(metadataRaw) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: 'metadata must be valid JSON.' },
          { status: 400 }
        );
      }
    }

    const docId =
      (typeof metadataPayload.id === 'string' && metadataPayload.id) ||
      randomUUID();

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || `${docId}${path.extname(file.name || '')}`;
    const fileKey = path
      .posix
      .join(sectionId, fileName)
      .replace(/^\//, '');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: requiredBucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.type || undefined,
      })
    );

    const nowIso = new Date().toISOString();

    const storedMetadata: StoredDocumentMetadata = {
      id: docId,
      sectionId,
      sectionName,
      title:
        (typeof metadataPayload.title === 'string' &&
          metadataPayload.title.trim()) ||
        fileName,
      type:
        (typeof metadataPayload.type === 'string' &&
          metadataPayload.type.trim()) ||
        (file.type ? file.type : path.extname(fileName).replace('.', '').toUpperCase() || 'Document'),
      tags: coerceArrayOfStrings(metadataPayload.tags),
      content: replacePdfEmbedWithPlaceholder(
        typeof metadataPayload.content === 'string'
          ? metadataPayload.content
          : null,
        fileKey
      ),
      textContent:
        typeof metadataPayload.textContent === 'string'
          ? metadataPayload.textContent
          : null,
      indClassification: metadataPayload.indClassification,
      originalPath:
        typeof metadataPayload.originalPath === 'string'
          ? metadataPayload.originalPath
          : null,
      warning:
        typeof metadataPayload.warning === 'string'
          ? metadataPayload.warning
          : null,
      sources:
        typeof metadataPayload.sources === 'number'
          ? metadataPayload.sources
          : 1,
      starred:
        typeof metadataPayload.starred === 'boolean'
          ? metadataPayload.starred
          : false,
      uploadedAt: nowIso,
      size: file.size,
      fileKey,
      originalFileName: fileName,
    };

    if (
      metadataPayload.extra &&
      typeof metadataPayload.extra === 'object'
    ) {
      storedMetadata.extra = metadataPayload.extra as Record<string, unknown>;
    }

    const metadataKey = path.posix.join(sectionId, `${docId}.metadata.json`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: requiredBucket,
        Key: metadataKey,
        Body: JSON.stringify(storedMetadata, null, 2),
        ContentType: 'application/json',
      })
    );

    const sectionMetadataKey = path.posix.join(sectionId, 'section.json');
    await s3Client.send(
      new PutObjectCommand({
        Bucket: requiredBucket,
        Key: sectionMetadataKey,
        Body: JSON.stringify(
          {
            id: sectionId,
            name: sectionName,
            updatedAt: nowIso,
          },
          null,
          2
        ),
        ContentType: 'application/json',
      })
    );

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: requiredBucket,
        Key: fileKey,
      }),
      { expiresIn: SIGNED_URL_TTL_SECONDS }
    );

    const responseDocument: StoredDocumentWithUrl = {
      ...storedMetadata,
      fileUrl: signedUrl,
      content: storedMetadata.content
        ? storedMetadata.content.replace(
            new RegExp(`s3key:${storedMetadata.fileKey}`, 'g'),
            signedUrl
          )
        : storedMetadata.content,
    };

    return NextResponse.json(
      { document: responseDocument },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document.' },
      { status: 500 }
    );
  }
}
