const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.resolve(PROJECT_ROOT, "src");
const FIGMA_ASSET_REGEX =
  /([A-Za-z0-9_]+)\s*:\s*['"](https:\/\/www\.figma\.com\/api\/mcp\/asset\/[A-Za-z0-9-]+)['"]/g;
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsAt = line.indexOf("=");
    if (equalsAt <= 0) {
      continue;
    }

    const key = line.slice(0, equalsAt).trim();
    let value = line.slice(equalsAt + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadEnvVariables() {
  loadEnvFile(path.resolve(PROJECT_ROOT, ".env"));
  loadEnvFile(path.resolve(PROJECT_ROOT, ".env.local"));
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function getConfig() {
  return {
    accountId: requiredEnv("R2_ACCOUNT_ID"),
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    bucketName: requiredEnv("R2_BUCKET_NAME"),
    publicUrl: requiredEnv("R2_PUBLIC_URL").replace(/\/$/, ""),
  };
}

function collectSourceFiles(rootDir) {
  const files = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const dir = queue.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "scripts") {
          continue;
        }
        queue.push(fullPath);
        continue;
      }

      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function folderByAssetKey(assetKey) {
  const key = assetKey.toLowerCase();
  if (key.includes("hero")) return "hero";
  if (key.includes("product")) return "product";
  if (key.includes("category")) return "category";
  if (key.includes("footer")) return "footer";
  if (key.includes("bottomnav") || key.includes("nav")) return "navigation";
  if (key.includes("logo")) return "logo";
  if (key.includes("icon")) return "icons";
  if (key.includes("search")) return "search";
  return "assets";
}

function extensionForMime(mime) {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/svg+xml":
      return "svg";
    default:
      return "webp";
  }
}

function buildObjectKey(folder, mime) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${folder}/${datePart}-${nanoid(10)}.${extensionForMime(mime)}`;
}

async function fetchAsset(url) {
  const maxAttempts = 6;
  const figmaAccessToken = process.env.FIGMA_ACCESS_TOKEN?.trim();
  const headers = figmaAccessToken
    ? {
        Authorization: `Bearer ${figmaAccessToken}`,
      }
    : undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (attempt === maxAttempts) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      continue;
    }

    const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (mime.startsWith("image/")) {
      const body = Buffer.from(await response.arrayBuffer());
      return { mime, body };
    }

    if (attempt === maxAttempts) {
      throw new Error(`Non-image content for ${url}: ${mime}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }

  throw new Error(`Exhausted retries for ${url}`);
}

async function uploadAsset(r2Client, bucketName, publicUrl, folder, sourceUrl, cache) {
  const cached = cache.get(sourceUrl);
  if (cached) {
    return cached;
  }

  const asset = await fetchAsset(sourceUrl);
  const key = buildObjectKey(folder, asset.mime);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: asset.body,
      ContentType: asset.mime,
    })
  );

  const nextUrl = publicUrl.includes(".r2.cloudflarestorage.com") ? `/api/r2/${key}` : `${publicUrl}/${key}`;
  cache.set(sourceUrl, nextUrl);
  return nextUrl;
}

async function migrateFile(filePath, context) {
  const original = fs.readFileSync(filePath, "utf8");
  const matches = Array.from(original.matchAll(FIGMA_ASSET_REGEX));
  if (matches.length === 0) {
    return { changed: false, replaced: 0 };
  }

  let next = original;
  let replaced = 0;

  for (const match of matches) {
    const [fullMatch, assetKey, sourceUrl] = match;
    const folder = folderByAssetKey(assetKey);
    let nextUrl;
    try {
      nextUrl = await uploadAsset(
        context.r2Client,
        context.bucketName,
        context.publicUrl,
        folder,
        sourceUrl,
        context.cache
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upload error";
      context.failed.push({
        file: path.relative(PROJECT_ROOT, filePath),
        assetKey,
        sourceUrl,
        message,
      });
      continue;
    }

    if (next.includes(fullMatch)) {
      next = next.replace(fullMatch, `${assetKey}: '${nextUrl}'`);
      replaced += 1;
    }
  }

  if (next === original) {
    return { changed: false, replaced: 0 };
  }

  fs.writeFileSync(filePath, next, "utf8");
  return { changed: true, replaced };
}

async function main() {
  loadEnvVariables();
  const config = getConfig();

  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const files = collectSourceFiles(SRC_ROOT);
  const cache = new Map();
  const failed = [];

  let totalReplaced = 0;
  const changedFiles = [];

  for (const filePath of files) {
    const result = await migrateFile(filePath, {
      r2Client,
      bucketName: config.bucketName,
      publicUrl: config.publicUrl,
      cache,
      failed,
    });

    if (result.changed) {
      changedFiles.push(path.relative(PROJECT_ROOT, filePath));
      totalReplaced += result.replaced;
    }
  }

  console.log("Figma assets migrated to R2.");
  console.log("Changed files:", changedFiles.length);
  console.log("Replaced URLs:", totalReplaced);
  if (changedFiles.length > 0) {
    console.log(changedFiles);
  }
  if (failed.length > 0) {
    console.log("Failed URLs:", failed.length);
    console.log(failed);
  }
}

main().catch((error) => {
  console.error("Failed to migrate figma assets:", error);
  process.exit(1);
});
