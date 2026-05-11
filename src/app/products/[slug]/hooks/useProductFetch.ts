import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../lib/api-client';
import { getStoredLanguage } from '../../../../lib/language';
import { logger } from '@/lib/utils/logger';
import { RESERVED_ROUTES } from '../types';
import type { Product } from '../types';

interface UseProductFetchProps {
  slug: string;
  variantIdFromUrl: string | null;
}

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      Number((error as { status: number }).status) === 404
  );
}

async function fetchProductForLang(slug: string, lang: string): Promise<Product> {
  return apiClient.get<Product>(`/api/v1/products/${slug}/details`, {
    params: { lang },
  });
}

export function useProductFetch({ slug, variantIdFromUrl }: UseProductFetchProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const generationRef = useRef(0);

  const runLoad = useCallback(async () => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) {
      setLoading(false);
      return;
    }
    const gen = ++generationRef.current;
    setLoading(true);
    setNotFound(false);
    setProduct(null);

    const currentLang = getStoredLanguage();

    const load = async (lang: string) => {
      try {
        return await fetchProductForLang(slug, lang);
      } catch (second: unknown) {
        if (isNotFoundError(second) && lang !== 'en') {
          return fetchProductForLang(slug, 'en');
        }
        throw second;
      }
    };

    try {
      const data = await load(currentLang);
      if (gen !== generationRef.current) return;
      setProduct(data);
    } catch (error: unknown) {
      logger.warn('Product fetch failed', {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
      try {
        const fallback = await apiClient.get<Product>(`/api/v1/products/${slug}`, {
          params: { lang: currentLang },
        });
        if (gen !== generationRef.current) return;
        setProduct(fallback);
      } catch (inner: unknown) {
        if (gen !== generationRef.current) return;
        setProduct(null);
        setNotFound(isNotFoundError(inner));
      }
    } finally {
      if (gen === generationRef.current) {
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
    void runLoad();

    const handleLanguageUpdate = () => {
      void runLoad();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [slug, variantIdFromUrl, router, runLoad]);

  return {
    product,
    loading,
    notFound,
  };
}
