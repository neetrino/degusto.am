import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { logger } from "@/lib/observability/logger";
import { isR2ApiEndpointUrl } from "@/lib/r2/public-base-url";
import type { ObjectStorageAdapter } from "@/lib/r2/types";

export type R2AdapterConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
  /** Defaults to `https://{accountId}.r2.cloudflarestorage.com`. */
  endpoint?: string;
};

const PRESIGN_TTL_SECONDS = 15 * 60;
const READ_URL_TTL_SECONDS = 60 * 60;

/** Cloudflare R2 adapter (S3-compatible API). */
export function createR2ObjectStorageAdapter(
  config: R2AdapterConfig,
): ObjectStorageAdapter {
  const endpoint =
    config.endpoint?.replace(/\/$/, "") ??
    `https://${config.accountId}.r2.cloudflarestorage.com`;
  const publicBaseUrl = config.publicBaseUrl.replace(/\/$/, "");
  const useSignedReads = isR2ApiEndpointUrl(publicBaseUrl);

  if (useSignedReads) {
    logger.warn("r2.public_base_url_is_api_endpoint", {
      message:
        "R2_PUBLIC_BASE_URL points at the S3 API host; using signed GET URLs. Set a public r2.dev or custom CDN URL for production.",
    });
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  function buildPublicUrl(objectKey: string): string {
    const key = objectKey.replace(/^\//, "");
    return `${publicBaseUrl}/${key}`;
  }

  return {
    name: "cloudflare-r2",
    async createPresignedUpload({ objectKey, contentType }) {
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: PRESIGN_TTL_SECONDS,
      });
      return {
        objectKey,
        uploadUrl,
        expiresAt: new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000),
      };
    },
    async putObject({ objectKey, body, contentType }) {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: objectKey,
            Body: body,
            ContentType: contentType,
          }),
        );
      } catch (error) {
        logger.error("r2.put_object_failed", {
          objectKey,
          message: error instanceof Error ? error.message : "unknown",
        });
        throw error;
      }
    },
    buildPublicUrl,
    async resolveReadableUrl(objectKey) {
      const key = objectKey.replace(/^\//, "");
      if (!useSignedReads) {
        return buildPublicUrl(key);
      }
      try {
        return await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: config.bucketName,
            Key: key,
          }),
          { expiresIn: READ_URL_TTL_SECONDS },
        );
      } catch (error) {
        logger.error("r2.sign_get_failed", {
          objectKey: key,
          message: error instanceof Error ? error.message : "unknown",
        });
        return buildPublicUrl(key);
      }
    },
    async deleteObject(objectKey) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: objectKey,
          }),
        );
      } catch (error) {
        logger.warn("r2.delete_object_failed", {
          objectKey,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    },
  };
}
