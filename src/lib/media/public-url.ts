import "server-only";

import { getProviders } from "@/config/providers";

/**
 * Resolves a stored object key to a public URL.
 * Repo-committed files under `public/assets/` stay as local paths so seed
 * and brand assets work without uploading to object storage.
 */
export function mediaPublicUrl(objectKey: string): string {
  const key = objectKey.replace(/^\//, "");
  if (key.startsWith("assets/")) {
    return `/${key}`;
  }

  return getProviders().storage.buildPublicUrl(objectKey);
}
