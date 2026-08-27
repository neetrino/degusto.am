import { pickUsableR2PublicBaseUrl } from "@/lib/r2/public-base-url";

/**
 * Client-safe CDN URL for static keys under `/assets` and `/images`
 * (uploaded to R2; no longer served from `public/`).
 */
export function getStaticAssetBaseUrl(): string {
  return (
    pickUsableR2PublicBaseUrl(
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,
    ) ?? ""
  );
}

/**
 * Maps `/assets/...` or `/images/...` to the public R2 base.
 * Other paths are returned unchanged (with a leading slash when relative).
 */
export function staticAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getStaticAssetBaseUrl();
  if (
    base &&
    (normalized.startsWith("/assets/") || normalized.startsWith("/images/"))
  ) {
    return `${base}${normalized}`;
  }
  return normalized;
}
