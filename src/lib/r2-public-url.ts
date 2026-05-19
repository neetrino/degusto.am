/**
 * Resolves R2 object keys to browser URLs: public CDN when configured, else `/api/r2/*` proxy.
 *
 * Set `NEXT_PUBLIC_R2_PUBLIC_URL` (and `R2_PUBLIC_URL` on server) to your public custom domain,
 * e.g. `https://cdn.example.com` — not the `*.r2.cloudflarestorage.com` S3 endpoint.
 */

const R2_PROXY_PREFIX = '/api/r2/';

function isR2StorageEndpoint(urlValue: string): boolean {
  try {
    const parsed = new URL(urlValue);
    return parsed.protocol === 'https:' && /\.r2\.cloudflarestorage\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function getR2PublicCdnBase(): string {
  const fromPublic = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
  if (fromPublic) {
    return fromPublic;
  }
  const fromServer = process.env.R2_PUBLIC_URL?.trim();
  return fromServer ?? '';
}

/**
 * Strips `/api/r2/` prefix and leading slashes from a key or proxy path.
 */
export function normalizeR2ObjectKey(keyOrPath: string): string {
  const trimmed = keyOrPath.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith(R2_PROXY_PREFIX)) {
    return trimmed.slice(R2_PROXY_PREFIX.length).replace(/^\/+/, '');
  }
  return trimmed.replace(/^\/+/, '');
}

/**
 * Builds a public URL for an R2 object key or existing `/api/r2/...` path.
 */
export function resolveR2AssetUrl(keyOrPath: string): string {
  const trimmed = keyOrPath.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  const objectKey = normalizeR2ObjectKey(trimmed);
  if (!objectKey || objectKey.startsWith('http')) {
    return objectKey || trimmed;
  }

  const cdnBase = getR2PublicCdnBase();
  if (!cdnBase || isR2StorageEndpoint(cdnBase)) {
    return `${R2_PROXY_PREFIX}${objectKey}`;
  }

  return `${cdnBase.replace(/\/$/, '')}/${objectKey}`;
}

/** Shorthand for static Figma/home keys, e.g. `r2Asset('hero/20260512-tOKhBzyB6u.png')`. */
export function r2Asset(objectKey: string): string {
  return resolveR2AssetUrl(objectKey);
}
