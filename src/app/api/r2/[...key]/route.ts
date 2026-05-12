import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  if (!r2Client || !bucketName) {
    return new NextResponse("R2 is not configured", { status: 503 });
  }

  const { key } = await context.params;
  const objectKey = key.join("/");
  if (!objectKey) {
    return new NextResponse("Object key is required", { status: 400 });
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
      return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
