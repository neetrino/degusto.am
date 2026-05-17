const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const TARGET_FILE = path.resolve(
  process.cwd(),
  "src/constants/mobile-shop-category-images.ts"
);

/** Already on R2 — keep stable URLs. */
const EXISTING_R2_BY_SLUG = {
  shawarma: "/api/r2/assets/20260512-plUR8fm4WB.png",
  burger: "/api/r2/category/20260512-1bbwOOTncy.png",
  soup: "/api/r2/assets/20260512-AQ7ex5ejKk.png",
  soups: "/api/r2/assets/20260512-AQ7ex5ejKk.png",
  "soups-and-hot-dishes": "/api/r2/assets/20260512-AQ7ex5ejKk.png",
  salad: "/api/r2/assets/20260512-mjMgqeHOCf.png",
  salads: "/api/r2/assets/20260512-mjMgqeHOCf.png",
};

/** Figma MCP sources (degusto-devv category cards). */
const FIGMA_SOURCE_BY_SLUG = {
  kebab: "https://www.figma.com/api/mcp/asset/2a10c594-014a-4746-8bae-14f30abeab4c",
  wraps: "https://www.figma.com/api/mcp/asset/a7ea7fbc-9d36-4205-9da9-20e20a7f5871",
  plates: "https://www.figma.com/api/mcp/asset/2a10c594-014a-4746-8bae-14f30abeab4c",
  snacks: "https://www.figma.com/api/mcp/asset/b7c9176f-e64d-4e77-9bdb-f53b43627ad6",
  sandwiches: "https://www.figma.com/api/mcp/asset/b7c9176f-e64d-4e77-9bdb-f53b43627ad6",
  pasta: "https://www.figma.com/api/mcp/asset/f4485f91-b50a-4c1a-a782-b2b7349d34db",
};

const IMAGE_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

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

function isR2StorageEndpoint(urlValue) {
  try {
    const parsed = new URL(urlValue);
    return (
      parsed.protocol === "https:" &&
      /\.r2\.cloudflarestorage\.com$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function extensionForMime(mime) {
  return IMAGE_MIME_TO_EXTENSION[mime] || "png";
}

function buildR2Key(slug, mime) {
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `category/${dateSegment}-${slug}-${nanoid(6)}.${extensionForMime(mime)}`;
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
  if (isR2StorageEndpoint(publicUrl)) {
    return `/api/r2/${key}`;
  }
  return `${publicUrl}/${key}`;
}

function formatRecord(entries) {
  const lines = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, url]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(url)},`);
  return lines.join("\n");
}

function writeConstantsFile(fallbackImages) {
  const content = `/** Fallback card art for mobile shop category grid when DB has no icon. */
export const MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
${formatRecord(fallbackImages)}
};

export function resolveMobileShopCategoryImage(slug: string, iconUrl: string | null): string | null {
  if (iconUrl?.trim()) {
    return iconUrl;
  }
  return MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES[slug.trim().toLowerCase()] ?? null;
}
`;
  fs.writeFileSync(TARGET_FILE, content, "utf8");
}

async function main() {
  loadEnvVariables();
  const config = getConfig();

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const fallbackImages = { ...EXISTING_R2_BY_SLUG };
  const uploaded = [];

  for (const [slug, sourceUrl] of Object.entries(FIGMA_SOURCE_BY_SLUG)) {
    const payload = await fetchImagePayload(sourceUrl);
    const objectKey = buildR2Key(slug, payload.mime);
    const uploadedUrl = await uploadToR2(
      r2,
      config.bucketName,
      config.publicUrl,
      objectKey,
      payload.body,
      payload.mime
    );
    fallbackImages[slug] = uploadedUrl;
    uploaded.push({ slug, uploadedUrl });
  }

  writeConstantsFile(fallbackImages);
  console.log("Mobile shop category images migrated:", uploaded);
}

main().catch((error) => {
  console.error("Failed to migrate mobile shop category images:", error);
  process.exit(1);
});
