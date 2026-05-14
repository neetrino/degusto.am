import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const r2Client =
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

/** Visible placeholder so dev is not “empty UI” when R2 is missing or keys are wrong in the bucket. */
const R2_DEV_FALLBACK_PUBLIC_PATH = "/images/dev-r2-fallback.svg";

let loggedDevR2VisibleFallback = false;

function devRedirectToR2Fallback(req: NextRequest, reason: string): NextResponse {
  if (!loggedDevR2VisibleFallback) {
    loggedDevR2VisibleFallback = true;
    logger.warn(
      `[api/r2] ${reason}; redirecting /api/r2/* to ${R2_DEV_FALLBACK_PUBLIC_PATH} in development. Set R2_* in .env and upload objects (e.g. pnpm run images:migrate:homepage).`
    );
  }
  return NextResponse.redirect(new URL(R2_DEV_FALLBACK_PUBLIC_PATH, req.nextUrl.origin), 307);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const { key } = await context.params;
  const objectKey = key.join("/");
  if (!objectKey) {
    return new NextResponse("Object key is required", { status: 400 });
  }

  if (!r2Client || !bucketName) {
    if (process.env.NODE_ENV === "development") {
      return devRedirectToR2Fallback(req, "R2 credentials or bucket name missing");
    }
    return new NextResponse("R2 is not configured", { status: 503 });
  }

  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );

    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) {
      if (process.env.NODE_ENV === "development") {
        return devRedirectToR2Fallback(req, `Object empty or missing (${objectKey})`);
      }
      return new NextResponse("File not found", { status: 404 });
    }

    const normalizedBytes = Uint8Array.from(bytes);
    const body = new Blob([normalizedBytes]);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    if (process.env.NODE_ENV === "development") {
      return devRedirectToR2Fallback(req, `R2 getObject failed (${objectKey})`);
    }
    return new NextResponse("File not found", { status: 404 });
  }
}
