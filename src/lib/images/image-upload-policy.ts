import { ADMIN_UPLOAD_MAX_IMAGE_BYTES } from '@/lib/admin/admin-upload.constants';
import { isSvgImageMime } from '@/lib/images/prepare-raster-for-r2';

export class ImageUploadPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadPolicyError';
  }
}

/** Rejects SVG and other disallowed image MIME types. */
export function assertAllowedUploadMime(mime: string): void {
  if (isSvgImageMime(mime)) {
    throw new ImageUploadPolicyError('SVG uploads are not allowed');
  }
}

/** Validates a base64 data URL header and MIME type. */
export function assertAllowedImageDataUrl(dataUrl: string): { mime: string } {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,/i);
  if (!match) {
    throw new ImageUploadPolicyError('Invalid image data URL');
  }
  const mime = match[1].toLowerCase();
  assertAllowedUploadMime(mime);
  return { mime };
}

/** Estimates decoded size and rejects oversized payloads. */
export function assertBase64ImageWithinSizeLimit(
  dataUrl: string,
  maxBytes = ADMIN_UPLOAD_MAX_IMAGE_BYTES,
): void {
  const payload = dataUrl.split(',')[1];
  if (!payload) {
    throw new ImageUploadPolicyError('Invalid base64 payload');
  }
  const estimatedBytes = Math.ceil((payload.length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    throw new ImageUploadPolicyError(`Image exceeds ${maxBytes} bytes`);
  }
}

/** Full client upload validation for a single data URL image. */
export function validateImageDataUrlForUpload(dataUrl: string): void {
  assertAllowedImageDataUrl(dataUrl);
  assertBase64ImageWithinSizeLimit(dataUrl);
}
