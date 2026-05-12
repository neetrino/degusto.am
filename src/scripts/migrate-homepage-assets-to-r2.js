const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const TARGET_FILE = path.resolve(process.cwd(), "src/components/home/FigmaHomePage.tsx");

const ASSET_KEYS_TO_MIGRATE = ["heroBg", "product", "productCardImage"];

const ASSET_PREFIX_BY_KEY = {
  heroBg: "hero",
  product: "product",
  productCardImage: "product",
};

const ASSET_SOURCE_OVERRIDE_BY_KEY = {
  heroBg: "https://www.figma.com/api/mcp/asset/85cedb2c-a501-40fe-9b97-de4ab816ce45",
  product: "https://www.figma.com/api/mcp/asset/391d8c26-5fd9-4a5a-bd37-4fb776b3791d",
  productCardImage: "https://www.figma.com/api/mcp/asset/bfa37838-b9d6-4bdf-8ad2-5f4d937f39b3",
};

const IMAGE_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalIndex = line.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();
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
  const rootDir = process.cwd();
  loadEnvFile(path.resolve(rootDir, ".env"));
  loadEnvFile(path.resolve(rootDir, ".env.local"));
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

function findAssetUrl(fileContent, assetKey) {
  const regex = new RegExp(`${assetKey}:\\s*'([^']+)'`);
  const match = fileContent.match(regex);
  return match ? match[1] : null;
}

function extensionForMime(mime) {
  return IMAGE_MIME_TO_EXTENSION[mime] || "webp";
}

function buildR2Key(prefix, mime) {
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}/${dateSegment}-${nanoid(10)}.${extensionForMime(mime)}`;
}

async function fetchImagePayload(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${url} (${response.status})`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase().split(";")[0];
  if (!contentType.startsWith("image/")) {
    throw new Error(`Invalid image content-type for ${url}: ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { mime: contentType, body: buffer };
}

async function uploadToR2(r2, bucketName, publicUrl, key, body, mime) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: mime,
    })
  );
  if (publicUrl.includes(".r2.cloudflarestorage.com")) {
    return `/api/r2/${key}`;
  }
  return `${publicUrl}/${key}`;
}

function replaceAssetUrl(fileContent, assetKey, nextUrl) {
  const regex = new RegExp(`(${assetKey}:\\s*')[^']+(')`);
  return fileContent.replace(regex, `$1${nextUrl}$2`);
}

async function main() {
  loadEnvVariables();
  const config = getConfig();
  const originalContent = fs.readFileSync(TARGET_FILE, "utf8");

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  let nextContent = originalContent;
  const uploadedAssets = [];

  for (const key of ASSET_KEYS_TO_MIGRATE) {
    const sourceUrl = ASSET_SOURCE_OVERRIDE_BY_KEY[key] || findAssetUrl(originalContent, key);
    if (!sourceUrl) {
      throw new Error(`Asset key '${key}' not found in FigmaHomePage.tsx`);
    }

    const payload = await fetchImagePayload(sourceUrl);
    const objectPrefix = ASSET_PREFIX_BY_KEY[key] || "assets";
    const objectKey = buildR2Key(objectPrefix, payload.mime);
    const uploadedUrl = await uploadToR2(
      r2,
      config.bucketName,
      config.publicUrl,
      objectKey,
      payload.body,
      payload.mime
    );

    nextContent = replaceAssetUrl(nextContent, key, uploadedUrl);
    uploadedAssets.push({ key, uploadedUrl });
  }

  fs.writeFileSync(TARGET_FILE, nextContent, "utf8");
  console.log("Homepage assets migrated:", uploadedAssets);
}

main().catch((error) => {
  console.error("Failed to migrate homepage assets:", error);
  process.exit(1);
});
