import sharp from 'sharp';

export const R2_WEBP_CONTENT_TYPE = 'image/webp';
export const R2_WEBP_FILE_EXTENSION = 'webp';

const RASTER_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

const SVG_MIME = 'image/svg+xml';

export type PreparedR2Image = {
  buffer: Buffer;
  mime: string;
  extension: string;
};

export function isRasterImageMime(mime: string): boolean {
  return RASTER_MIME_TYPES.has(mime.toLowerCase());
}

export function isSvgImageMime(mime: string): boolean {
  return mime.toLowerCase() === SVG_MIME;
}

/**
 * Encodes raster uploads as WebP for R2. Vector SVG is stored as-is.
 */
export async function prepareImageBufferForR2Upload(
  buffer: Buffer,
  mime: string
): Promise<PreparedR2Image> {
  const normalizedMime = mime.toLowerCase();

  if (isSvgImageMime(normalizedMime)) {
    throw new Error('SVG uploads are not allowed');
  }

  if (!isRasterImageMime(normalizedMime)) {
    throw new Error(`Unsupported image type for upload: ${mime}`);
  }

  const webpBuffer = await sharp(buffer, { animated: normalizedMime === 'image/gif' })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  return {
    buffer: webpBuffer,
    mime: R2_WEBP_CONTENT_TYPE,
    extension: R2_WEBP_FILE_EXTENSION,
  };
}

