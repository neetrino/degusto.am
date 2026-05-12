import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const r2 =
  accountId && accessKeyId && secretAccessKey && bucketName
    ? new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

function buildPublicAssetUrl(key: string): string | null {
  if (!publicUrl) {
    return null;
  }

  const path = key.startsWith("/") ? key.slice(1) : key;
  const normalizedBase = publicUrl.replace(/\/$/, "");

  // R2 S3 endpoint is not directly public for browser image access.
  // Use internal proxy route to serve files from private bucket safely.
  if (normalizedBase.includes(".r2.cloudflarestorage.com")) {
    return `/api/r2/${path}`;
  }

  return `${normalizedBase}/${path}`;
}

/**
 * Upload a buffer to R2 and return the public URL.
 * Key will be prefixed with "products/" and get a unique suffix.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  if (!r2 || !bucketName || !publicUrl) {
    return null;
  }
  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return buildPublicAssetUrl(key);
}

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName && publicUrl);
}
