/** True when a URL is the R2 S3 API host, not a public CDN base. */
export function isR2ApiEndpointUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname.endsWith(".r2.cloudflarestorage.com");
  } catch {
    return false;
  }
}

/**
 * Public base must be a CDN / r2.dev / custom domain — not the S3 API endpoint.
 * API hosts are not readable by browsers without signed URLs.
 */
export function isR2PublicBaseUrlUsable(value: string): boolean {
  if (!value.trim()) {
    return false;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }
    return !isR2ApiEndpointUrl(value);
  } catch {
    return false;
  }
}

/** First candidate that is a browser-readable CDN, skipping S3 API hosts. */
export function pickUsableR2PublicBaseUrl(
  ...candidates: Array<string | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const value = candidate?.trim().replace(/\/$/, "") ?? "";
    if (value && isR2PublicBaseUrlUsable(value)) {
      return value;
    }
  }
  return undefined;
}
