'use client';

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
  const normalizedBrand = brand?.trim();

  if (!normalizedBrand) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
      {normalizedBrand ? (
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
          Brand: {normalizedBrand}
        </span>
      ) : null}
    </div>
  );
}
