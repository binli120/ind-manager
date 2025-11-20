import { S3Client } from '@aws-sdk/client-s3';

const sanitize = (value: string | undefined) =>
  typeof value === 'string' ? value.trim() : undefined;

const region =
  sanitize(process.env.AWS_REGION) ||
  sanitize(process.env.AWS_DEFAULT_REGION);

if (!region) {
  console.warn(
    '[s3-client] AWS_REGION (or AWS_DEFAULT_REGION) is not configured. S3 requests will fail until it is set.'
  );
}

const accessKeyId = sanitize(process.env.AWS_ACCESS_KEY_ID);
const secretAccessKey = sanitize(process.env.AWS_SECRET_ACCESS_KEY);
const sessionToken = sanitize(process.env.AWS_SESSION_TOKEN);

export const s3Client = new S3Client({
  region: region ?? 'us-east-1',
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
          sessionToken: sessionToken || undefined,
        }
      : undefined,
});

export const requiredBucket = sanitize(process.env.AWS_S3_BUCKET);

if (!requiredBucket) {
  console.warn(
    '[s3-client] AWS_S3_BUCKET is not configured. File operations will fail until it is set.'
  );
}
