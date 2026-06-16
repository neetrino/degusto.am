'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ProductPageLink } from '@/components/products/ProductPageLink';
import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n-client';
import {
  formatPrice,
  getStoredCurrency,
  HYDRATION_SAFE_CURRENCY,
  type CurrencyCode,
} from '../lib/currency';
import { useHasMounted } from '@/hooks/useHasMounted';
import type { InstantSearchResultItem } from './hooks/useInstantSearch';
import { resolveStorefrontProductImage } from '../constants/storefront-product-image';
import { createProductPreviewSummary } from '@/lib/products/product-preview';

export interface SearchDropdownProps {
  results: InstantSearchResultItem[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  selectedIndex: number;
  query: string;
  onResultClick?: (result: InstantSearchResultItem) => void;
  onClose: () => void;
  onSeeAllClick?: () => void;
  className?: string;
}

export function SearchDropdown({
  results,
  loading,
  error,
  isOpen,
  selectedIndex,
  query,
  onResultClick,
  onClose,
  onSeeAllClick,
  className = '',
}: SearchDropdownProps) {
  const { t } = useTranslation();
  const hasMounted = useHasMounted();
  const [currency, setCurrency] = useState<CurrencyCode>(HYDRATION_SAFE_CURRENCY);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    handleCurrencyUpdate();
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyUpdate);
    };
  }, [hasMounted]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="listbox"
      id="search-results"
      aria-label={t('common.ariaLabels.searchPlaceholder')}
      className={`absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-[min(70vh,400px)] overflow-hidden flex flex-col ${className}`}
    >
      <div className="overflow-y-auto flex-1 min-h-0">
        {loading && (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">
            {t('common.messages.loading')}
          </div>
        )}

        {error && !loading && (
          <div className="px-4 py-6 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && results.length === 0 && query.trim().length >= 1 && (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">
            {t('common.messages.noProductsFound')}
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <ul className="py-1" role="group">
            {results.map((result, index) => {
              const imageSrc = resolveStorefrontProductImage(result.image);
              const previewSummary = createProductPreviewSummary({
                id: result.id,
                slug: result.slug,
                title: result.title,
                image: imageSrc,
                price: result.price,
                oldPrice:
                  result.compareAtPrice != null && result.compareAtPrice > result.price
                    ? result.compareAtPrice
                    : null,
                category: result.category ? { slug: `preview-${result.id}`, title: result.category } : null,
                currency,
              });

              return (
                <li key={result.id} role="option" aria-selected={index === selectedIndex}>
                  <ProductPageLink
                    slug={result.slug}
                    preview={previewSummary}
                    onClick={() => {
                      onClose();
                      onResultClick?.(result);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={imageSrc}
                        alt={result.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {result.title}
                      </p>
                      {result.category ? (
                        <p className="mt-0.5 text-xs text-gray-500">{result.category}</p>
                      ) : null}
                      <p className="mt-0.5 text-sm font-semibold text-gray-700">
                        {formatPrice(result.price, currency)}
                        {result.compareAtPrice != null && result.compareAtPrice > result.price ? (
                          <span className="ml-2 text-xs text-gray-500 line-through">
                            {formatPrice(result.compareAtPrice, currency)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </ProductPageLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && !error && query.trim().length >= 1 && (
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
          <Link
            href={`/shop?search=${encodeURIComponent(query.trim())}`}
            onClick={() => {
              onClose();
              onSeeAllClick?.();
            }}
            className="block text-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {t('common.search.seeAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
