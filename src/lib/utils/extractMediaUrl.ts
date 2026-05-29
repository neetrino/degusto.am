/**
 * Extract first image URL from product media (JSON array).
 * Used by cart, orders, and product display to avoid duplicating logic.
 */
export type MediaItem = string | { url?: string; src?: string } | unknown;

function normalizeMediaItems(media: unknown): unknown[] {
  if (Array.isArray(media)) {
    return media;
  }

  if (typeof media === 'string') {
    const trimmed = media.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        return [parsed];
      }
    } catch {
      // Not a JSON payload, treat as direct URL value.
    }

    return [trimmed];
  }

  if (media && typeof media === 'object') {
    return [media];
  }

  return [];
}

export function extractMediaUrl(media: unknown): string | null {
  const items = normalizeMediaItems(media);
  if (items.length === 0) {
    return null;
  }

  for (const item of items) {
    if (typeof item === 'string' && item.trim().length > 0) {
      return item.trim();
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const withUrl = item as { url?: unknown; src?: unknown; value?: unknown };
    if (typeof withUrl.url === 'string' && withUrl.url.trim().length > 0) {
      return withUrl.url.trim();
    }
    if (typeof withUrl.src === 'string' && withUrl.src.trim().length > 0) {
      return withUrl.src.trim();
    }
    if (typeof withUrl.value === 'string' && withUrl.value.trim().length > 0) {
      return withUrl.value.trim();
    }
  }

  return null;
}

/** First URL from variant `imageUrl` (may be comma-separated). */
export function extractVariantImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  const first = imageUrl
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  return first ?? null;
}
