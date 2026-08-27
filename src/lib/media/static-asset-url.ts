/**
 * Same-origin path for static keys under `/assets` and `/images`.
 * Next rewrites those prefixes to R2 via `R2_PUBLIC_BASE_URL`.
 */
export function staticAssetUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
