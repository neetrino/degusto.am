import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredLanguage } from '../../../../lib/language';
import { logger } from '@/lib/utils/logger';
import { RESERVED_ROUTES } from '../types';
import type { Product } from '../types';
import { isNotFoundError, loadProductProgressive } from './fetch-product-client';

interface UseProductFetchProps {
  slug: string;
  variantIdFromUrl: string | null;
  initialProduct: Product | null;
  initialNotFound: boolean;
  serverLocale: string;
}

export function useProductFetch({
  slug,
  variantIdFromUrl,
  initialProduct,
  initialNotFound,
  serverLocale,
}: UseProductFetchProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(initialProduct === null && !initialNotFound);
  const [notFound, setNotFound] = useState(initialNotFound);
  const generationRef = useRef(0);
  const productRef = useRef<Product | null>(initialProduct);

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  const runLoad = useCallback(async () => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) {
      setLoading(false);
      return;
    }

    const gen = ++generationRef.current;
    const hadProduct = productRef.current !== null;
    if (!hadProduct) {
      setLoading(true);
    }
    setNotFound(false);

    const currentLang = getStoredLanguage();
    const isStale = () => gen !== generationRef.current;

    try {
      const data = await loadProductProgressive({
        slug,
        lang: currentLang,
        previousProduct: productRef.current,
        onVisualApplied: (partial) => {
          if (!isStale()) {
            setProduct(partial);
          }
        },
        isStale,
      });
      if (isStale()) return;
      setProduct(data);
    } catch (error: unknown) {
      logger.warn('Product progressive fetch failed', {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
      if (isStale()) return;
      setProduct(null);
      setNotFound(isNotFoundError(error));
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
      router.replace(`/${slug}`);
    }
  }, [slug, router]);

  useEffect(() => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) return;

    const storedLang = getStoredLanguage();
    if (initialProduct && storedLang === serverLocale && !initialNotFound) {
      return;
    }

    void runLoad();

    const handleLanguageUpdate = () => {
      void runLoad();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [slug, variantIdFromUrl, router, runLoad, initialProduct, initialNotFound, serverLocale]);

  return {
    product,
    loading,
    notFound,
  };
}
