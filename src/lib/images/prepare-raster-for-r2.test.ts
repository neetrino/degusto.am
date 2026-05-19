import { describe, expect, it } from 'vitest';
import { isRasterImageMime, isSvgImageMime } from '@/lib/images/prepare-raster-for-r2';

describe('prepare-raster-for-r2', () => {
  it('treats common raster mime types as encodable', () => {
    expect(isRasterImageMime('image/jpeg')).toBe(true);
    expect(isRasterImageMime('image/png')).toBe(true);
    expect(isRasterImageMime('image/webp')).toBe(true);
  });

  it('keeps svg separate from raster pipeline', () => {
    expect(isSvgImageMime('image/svg+xml')).toBe(true);
    expect(isRasterImageMime('image/svg+xml')).toBe(false);
  });
});
