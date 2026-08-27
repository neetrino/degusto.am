/**
 * Upload public/assets and public/images to Cloudflare R2 with stable keys
 * matching paths relative to public/ (e.g. assets/brand/logo.webp).
 *
 * Usage: node scripts/upload-public-assets-to-r2.mjs
 */
import { createReadStream, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const CONTENT_TYPES = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

function loadEnv() {
  const env = {};
  const text = readFileSync(path.join(projectRoot, ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="(.*)"$/);
    if (match) {
      env[match[1]] = match[2];
    } else {
      const bare = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (bare && !bare[2].startsWith("#")) {
        env[bare[1]] = bare[2].replace(/^"(.*)"$/, "$1");
      }
    }
  }
  return env;
}

function isR2ApiEndpointUrl(value) {
  try {
    return new URL(value).hostname.toLowerCase().endsWith(
      ".r2.cloudflarestorage.com",
    );
  } catch {
    return false;
  }
}

function walkFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

const env = loadEnv();
const accountId = env.R2_ACCOUNT_ID;
const accessKeyId = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
const bucket = env.R2_BUCKET_NAME;
const publicBase = (env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2 credentials in .env");
  process.exit(1);
}

if (!publicBase || isR2ApiEndpointUrl(publicBase)) {
  console.error(
    "R2_PUBLIC_BASE_URL must be a public CDN (pub-….r2.dev), not the S3 API host.",
  );
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const roots = ["assets", "images"].map((name) =>
  path.join(projectRoot, "public", name),
);

const files = [];
for (const root of roots) {
  try {
    files.push(...walkFiles(root));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      console.warn(`Skip missing dir: ${root}`);
      continue;
    }
    throw error;
  }
}

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const filePath of files) {
  const objectKey = path
    .relative(path.join(projectRoot, "public"), filePath)
    .split(path.sep)
    .join("/");
  const size = statSync(filePath).size;
  const contentType = contentTypeFor(filePath);

  try {
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
      if (head.ContentLength === size) {
        skipped += 1;
        console.log(`SKIP  ${objectKey} (${size} bytes)`);
        continue;
      }
    } catch (error) {
      const status = error.$metadata?.httpStatusCode;
      if (status !== 404 && error.name !== "NotFound") {
        throw error;
      }
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: createReadStream(filePath),
        ContentType: contentType,
        ContentLength: size,
      }),
    );
    uploaded += 1;
    console.log(`PUT   ${objectKey} (${size} bytes, ${contentType})`);
  } catch (error) {
    failed += 1;
    console.error(
      `FAIL  ${objectKey}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

console.log("---");
console.log(`uploaded=${uploaded} skipped=${skipped} failed=${failed} total=${files.length}`);

const sampleKey = "assets/brand/logo.webp";
const sampleUrl = `${publicBase}/${sampleKey}`;
const response = await fetch(sampleUrl, { method: "HEAD" });
console.log(`PUBLIC_HEAD ${sampleUrl} → ${response.status}`);

if (failed > 0 || !response.ok) {
  process.exit(1);
}
