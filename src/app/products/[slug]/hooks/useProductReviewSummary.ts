import { useEffect } from 'react';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';
import { getStoredLanguage } from '@/lib/language';

/**
 * Hydrates review stars after SSR (aggregate is off critical path).
 */
export function useProductReviewSummary(
  slug: string,
  enabled: boolean,
  onSummary: (summary: ProductReviewSummary) => void
): void {
  useEffect(() => {
    if (!enabled || !slug) {
      return;
    }

    const lang = getStoredLanguage();
    const encoded = encodeURIComponent(slug);

    void fetch(`/api/v1/products/${encoded}/review-summary?lang=${lang}`, {
      method: 'GET',
      credentials: 'same-origin',
      priority: 'low',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ProductReviewSummary | null) => {
        if (data && typeof data.count === 'number') {
          onSummary(data);
        }
      })
      .catch(() => undefined);
  }, [slug, enabled, onSummary]);
}
