const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const { PrismaClient } = require("@prisma/client");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const HERO_SOURCE_URLS = [
  "https://images.pexels.com/photos/67102/pexels-photo-67102.jpeg?auto=compress&cs=tinysrgb&fm=webp&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/266688/pexels-photo-266688.jpeg?auto=compress&cs=tinysrgb&fm=webp&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/3217852/pexels-photo-3217852.jpeg?auto=compress&cs=tinysrgb&fm=webp&w=1260&h=750&dpr=2",
];

const IMAGE_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

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
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = requiredEnv("R2_BUCKET_NAME");
  const publicUrl = requiredEnv("R2_PUBLIC_URL").replace(/\/$/, "");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  };
}

function parseBase64DataUrl(value) {
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  return {
    mime: match[1].toLowerCase(),
    body: Buffer.from(match[2], "base64"),
  };
}

function mimeToExtension(mime) {
  return IMAGE_MIME_TO_EXTENSION[mime] || "webp";
}

function buildR2Key(prefix, mime) {
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ext = mimeToExtension(mime);
  return `${prefix}/${dateSegment}-${nanoid(10)}.${ext}`;
}

async function uploadToR2(r2Client, bucketName, publicUrl, key, body, contentType) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  if (isR2StorageEndpoint(publicUrl)) {
    return `/api/r2/${key}`;
  }
  return `${publicUrl}/${key}`;
}

async function fetchImageAsBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase().split(";")[0];
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL did not return image content-type: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    mime: contentType,
    body: Buffer.from(arrayBuffer),
  };
}

async function migrateImageValue({
  value,
  r2Client,
  bucketName,
  publicUrl,
  cache,
  keyPrefix,
}) {
  if (typeof value !== "string" || value.trim() === "") {
    return value;
  }

  const normalizedValue = value.trim();
  if (normalizedValue.startsWith(publicUrl)) {
    return normalizedValue;
  }

  const cached = cache.get(normalizedValue);
  if (cached) {
    return cached;
  }

  let imagePayload = null;
  if (normalizedValue.startsWith("data:image/")) {
    imagePayload = parseBase64DataUrl(normalizedValue);
    if (!imagePayload) {
      return normalizedValue;
    }
  } else if (/^https?:\/\//i.test(normalizedValue)) {
    imagePayload = await fetchImageAsBuffer(normalizedValue);
  } else {
    return normalizedValue;
  }

  const key = buildR2Key(keyPrefix, imagePayload.mime);
  const uploadedUrl = await uploadToR2(
    r2Client,
    bucketName,
    publicUrl,
    key,
    imagePayload.body,
    imagePayload.mime
  );

  cache.set(normalizedValue, uploadedUrl);
  return uploadedUrl;
}

function splitVariantImageUrls(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function migrateHeroImages(context) {
  const cache = new Map();
  const migratedUrls = [];

  for (const url of HERO_SOURCE_URLS) {
    const migrated = await migrateImageValue({
      value: url,
      cache,
      keyPrefix: "hero",
      ...context,
    });
    migratedUrls.push(migrated);
  }

  return migratedUrls;
}

async function migrateProductImages(context, prisma) {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      media: true,
      variants: {
        select: {
          id: true,
          imageUrl: true,
        },
      },
    },
  });

  const cache = new Map();
  let productsUpdated = 0;
  let variantsUpdated = 0;

  for (const product of products) {
    let productChanged = false;
    const nextMedia = Array.isArray(product.media) ? [...product.media] : [];

    for (let i = 0; i < nextMedia.length; i += 1) {
      const mediaItem = nextMedia[i];
      if (typeof mediaItem === "string") {
        const migrated = await migrateImageValue({
          value: mediaItem,
          cache,
          keyPrefix: "products",
          ...context,
        });
        if (migrated !== mediaItem) {
          nextMedia[i] = migrated;
          productChanged = true;
        }
        continue;
      }

      if (mediaItem && typeof mediaItem === "object") {
        const nextItem = { ...mediaItem };
        let itemChanged = false;

        if (typeof nextItem.url === "string") {
          const migratedUrl = await migrateImageValue({
            value: nextItem.url,
            cache,
            keyPrefix: "products",
            ...context,
          });
          if (migratedUrl !== nextItem.url) {
            nextItem.url = migratedUrl;
            itemChanged = true;
          }
        }

        if (typeof nextItem.src === "string") {
          const migratedSrc = await migrateImageValue({
            value: nextItem.src,
            cache,
            keyPrefix: "products",
            ...context,
          });
          if (migratedSrc !== nextItem.src) {
            nextItem.src = migratedSrc;
            itemChanged = true;
          }
        }

        if (itemChanged) {
          nextMedia[i] = nextItem;
          productChanged = true;
        }
      }
    }

    if (productChanged) {
      await prisma.product.update({
        where: { id: product.id },
        data: { media: nextMedia },
      });
      productsUpdated += 1;
    }

    for (const variant of product.variants) {
      const originalUrls = splitVariantImageUrls(variant.imageUrl);
      if (originalUrls.length === 0) {
        continue;
      }

      let variantChanged = false;
      const migratedUrls = [];
      for (const url of originalUrls) {
        const migrated = await migrateImageValue({
          value: url,
          cache,
          keyPrefix: "products",
          ...context,
        });
        migratedUrls.push(migrated);
        if (migrated !== url) {
          variantChanged = true;
        }
      }

      if (variantChanged) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { imageUrl: migratedUrls.join(",") },
        });
        variantsUpdated += 1;
      }
    }
  }

  return { productsUpdated, variantsUpdated };
}

function writeHeroUrlsToFile(heroUrls) {
  const heroCarouselPath = path.resolve(process.cwd(), "src/components/HeroCarousel.tsx");
  const current = fs.readFileSync(heroCarouselPath, "utf8");
  const replacement = `const heroImages = [\n  '${heroUrls[0]}',\n  '${heroUrls[1]}',\n  '${heroUrls[2]}',\n];`;
  const next = current.replace(/const heroImages = \[[\s\S]*?\];/, replacement);
  fs.writeFileSync(heroCarouselPath, next, "utf8");
}

async function main() {
  loadEnvVariables();

  const config = getConfig();
  const prisma = new PrismaClient();
  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  try {
    const heroUrls = await migrateHeroImages({
      r2Client,
      bucketName: config.bucketName,
      publicUrl: config.publicUrl,
    });
    writeHeroUrlsToFile(heroUrls);

    const productResult = await migrateProductImages(
      {
        r2Client,
        bucketName: config.bucketName,
        publicUrl: config.publicUrl,
      },
      prisma
    );

    console.log("Hero images migrated to R2:", heroUrls);
    console.log("Products updated:", productResult.productsUpdated);
    console.log("Variants updated:", productResult.variantsUpdated);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Image migration failed:", error);
  process.exit(1);
});
