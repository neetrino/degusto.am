'use client';

import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';

export interface ProductPrimaryMetaProps {
  categoryTitle?: string | null;
  brand?: string | null;
  language: LanguageCode;
}

export function ProductPrimaryMeta({
  categoryTitle,
  brand,
  language,
}: ProductPrimaryMetaProps) {
  const normalizedCategory = categoryTitle?.trim();
  const normalizedBrand = brand?.trim();

  if (!normalizedCategory && !normalizedBrand) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
      {normalizedCategory ? (
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
          {t(language, 'common.navigation.categories')}: {normalizedCategory}
        </span>
      ) : null}
      {normalizedBrand ? (
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
          Brand: {normalizedBrand}
        </span>
      ) : null}
    </div>
  );
}
