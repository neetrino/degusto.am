/** Application base URL without trailing slash (APP_URL or NEXT_PUBLIC_APP_URL). */
export function getAppUrl(): string {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!raw?.trim()) {
    throw new Error("APP_URL is not configured");
  }
  return raw.replace(/\/+$/, "");
}

/** Build absolute URL for payment callbacks and redirects. */
export function buildAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppUrl()}${normalizedPath}`;
}
