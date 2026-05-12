import { nanoid } from "nanoid";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { smartSplitUrls } from "@/lib/utils/image-utils";

const IMAGE_MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const R2_IMAGES_PREFIX = "products";

type MediaInputItem = string | { url?: string; [key: string]: unknown };

type VariantInputItem = {
  imageUrl?: string;
  [key: string]: unknown;
};

export type ProductImagesPayload = {
  media?: MediaInputItem[];
  mainProductImage?: string;
  variants?: VariantInputItem[];
  [key: string]: unknown;
};

function isBase64ImageDataUrl(value: string): boolean {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

function parseImageDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  const mime = match[1].toLowerCase();
  const base64Payload = match[2];

  return {
    mime,
    buffer: Buffer.from(base64Payload, "base64"),
  };
}

function buildR2ObjectKey(mime: string): string {
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const extension = IMAGE_MIME_TO_EXTENSION[mime] ?? "webp";

  return `${R2_IMAGES_PREFIX}/${dateSegment}-${nanoid(10)}.${extension}`;
}

async function uploadSingleBase64Image(
  value: string,
  uploadedCache: Map<string, string>
): Promise<string> {
  if (!isBase64ImageDataUrl(value)) {
    return value;
  }

  const cachedResult = uploadedCache.get(value);
  if (cachedResult) {
    return cachedResult;
  }

  const parsed = parseImageDataUrl(value);
  if (!parsed) {
    return value;
  }

  const key = buildR2ObjectKey(parsed.mime);
  const uploadedUrl = await uploadToR2(key, parsed.buffer, parsed.mime);
  if (!uploadedUrl) {
    throw new Error("Failed to upload image to R2");
  }

  uploadedCache.set(value, uploadedUrl);
  return uploadedUrl;
}

async function normalizeVariantImageUrls(
  variants: VariantInputItem[],
  uploadedCache: Map<string, string>
): Promise<VariantInputItem[]> {
  const normalizedVariants: VariantInputItem[] = [];

  for (const variant of variants) {
    if (!variant.imageUrl) {
      normalizedVariants.push(variant);
      continue;
    }

    const pieces = smartSplitUrls(variant.imageUrl);
    const normalizedPieces: string[] = [];

    for (const piece of pieces) {
      const normalizedPiece = await uploadSingleBase64Image(piece.trim(), uploadedCache);
      if (normalizedPiece) {
        normalizedPieces.push(normalizedPiece);
      }
    }

    normalizedVariants.push({
      ...variant,
      imageUrl: normalizedPieces.join(","),
    });
  }

  return normalizedVariants;
}

export function payloadContainsBase64Images(payload: ProductImagesPayload): boolean {
  if (typeof payload.mainProductImage === "string" && isBase64ImageDataUrl(payload.mainProductImage)) {
    return true;
  }

  if (Array.isArray(payload.media)) {
    for (const mediaItem of payload.media) {
      if (typeof mediaItem === "string" && isBase64ImageDataUrl(mediaItem)) {
        return true;
      }

      if (
        mediaItem &&
        typeof mediaItem === "object" &&
        typeof mediaItem.url === "string" &&
        isBase64ImageDataUrl(mediaItem.url)
      ) {
        return true;
      }
    }
  }

  if (Array.isArray(payload.variants)) {
    for (const variant of payload.variants) {
      if (typeof variant.imageUrl !== "string" || variant.imageUrl.trim() === "") {
        continue;
      }

      const images = smartSplitUrls(variant.imageUrl);
      if (images.some((image) => isBase64ImageDataUrl(image.trim()))) {
        return true;
      }
    }
  }

  return false;
}

export function canUploadProductImagesToR2(): boolean {
  return isR2Configured();
}

export async function uploadProductPayloadBase64ImagesToR2(
  payload: ProductImagesPayload
): Promise<ProductImagesPayload> {
  const uploadedCache = new Map<string, string>();

  const normalizedMedia: MediaInputItem[] | undefined = Array.isArray(payload.media)
    ? await Promise.all(
        payload.media.map(async (mediaItem) => {
          if (typeof mediaItem === "string") {
            return await uploadSingleBase64Image(mediaItem, uploadedCache);
          }

          if (mediaItem && typeof mediaItem === "object" && typeof mediaItem.url === "string") {
            return {
              ...mediaItem,
              url: await uploadSingleBase64Image(mediaItem.url, uploadedCache),
            };
          }

          return mediaItem;
        })
      )
    : undefined;

  const normalizedMainImage =
    typeof payload.mainProductImage === "string"
      ? await uploadSingleBase64Image(payload.mainProductImage, uploadedCache)
      : payload.mainProductImage;

  const normalizedVariants = Array.isArray(payload.variants)
    ? await normalizeVariantImageUrls(payload.variants, uploadedCache)
    : payload.variants;

  return {
    ...payload,
    media: normalizedMedia,
    mainProductImage: normalizedMainImage,
    variants: normalizedVariants,
  };
}
