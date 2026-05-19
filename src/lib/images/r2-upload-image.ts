import { prepareImageBufferForR2Upload } from '@/lib/images/prepare-raster-for-r2';

export function parseBase64ImageDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  return {
    mime: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
}

/**
 * Parses a data URL and normalizes raster images to WebP before R2 upload.
 */
export async function prepareBase64ImageForR2Upload(
  dataUrl: string
): Promise<{ buffer: Buffer; mime: string; extension: string }> {
  const parsed = parseBase64ImageDataUrl(dataUrl);
  if (!parsed) {
    throw new Error('Invalid base64 image data URL');
  }

  const prepared = await prepareImageBufferForR2Upload(parsed.buffer, parsed.mime);
  return prepared;
}
