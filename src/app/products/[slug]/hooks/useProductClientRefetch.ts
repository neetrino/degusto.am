import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import {
  alignClientLanguageWithServer,
  getStoredLanguage,
  type LanguageCode,
} from '../../../../lib/language';
import { logger } from '@/lib/utils/logger';
import { RESERVED_ROUTES } from '../types';
import type { Product } from '../types';
import {
  fetchProductDetails,
  isNotFoundError,
  loadProductProgressive,
} from './fetch-product-client';

interface UseProductClientRefetchProps {
  slug: string;
  serverLocale: string;
  productRef: MutableRefObject<Product | null>;
  onLoaded: (product: Product) => void;
  onNotFound: () => void;
  /** Skip mount fetch when SSR already has full product details. */
  skipMountFetch: boolean;
}

function hasFullProductDetails(product: Product | null): boolean {
  return Boolean(product && product.variants.length > 0);
}

export function useProductClientRefetch({
  slug,
  serverLocale,
  productRef,
  onLoaded,
  onNotFound,
  skipMountFetch,
}: UseProductClientRefetchProps) {
  const router = useRouter();
  const generationRef = useRef(0);

  const runLoad = useCallback(async () => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) {
      return;
    }

    const gen = ++generationRef.current;
    const currentLang = getStoredLanguage();
    const isStale = () => gen !== generationRef.current;
    const startedAt = Date.now();

    try {
      if (hasFullProductDetails(productRef.current)) {
        logger.debug('[PDP PERF] runLoad details refresh', { slug });
        const data = await fetchProductDetails(slug, currentLang);
        if (isStale()) return;
        productRef.current = data;
        onLoaded(data);
        logger.debug('[PDP PERF] details fetch complete', {
          slug,
          mode: 'details-only',
          durationMs: Date.now() - startedAt,
        });
        return;
      }

      const data = await loadProductProgressive({
        slug,
        lang: currentLang,
        previousProduct: productRef.current,
        onVisualApplied: (partial) => {
          if (!isStale()) {
            productRef.current = partial;
            onLoaded(partial);
          }
        },
        isStale,
      });
      if (isStale()) return;
      productRef.current = data;
      onLoaded(data);
      logger.debug('[PDP PERF] details fetch complete', {
        slug,
        mode: 'progressive',
        durationMs: Date.now() - startedAt,
      });
    } catch (error: unknown) {
      logger.warn('Product client refetch failed', {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
      if (isStale()) return;
      productRef.current = null;
      if (isNotFoundError(error)) {
        onNotFound();
      }
    }
  }, [slug, productRef, onLoaded, onNotFound]);

  useEffect(() => {
    if (!slug) return;
    if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
      router.replace(`/${slug}`);
    }
  }, [slug, router]);

  useEffect(() => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) return;

    if (skipMountFetch) {
      alignClientLanguageWithServer(serverLocale as LanguageCode);
      const handleLanguageUpdate = () => {
        void runLoad();
      };
      window.addEventListener('language-updated', handleLanguageUpdate);
      return () => {
        window.removeEventListener('language-updated', handleLanguageUpdate);
      };
    }

    void runLoad();

    const handleLanguageUpdate = () => {
      void runLoad();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [slug, router, runLoad, skipMountFetch, serverLocale]);
}
