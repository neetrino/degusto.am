'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getStoredLanguage } from '@/lib/language';
import { PRIMARY_LOCALE } from '@/lib/i18n/locale';

/**
 * Aligns `?lang=` with client localStorage without SSR cookies.
 * Default locale (hy) omits the query param to keep canonical URLs cache-friendly.
 */
export function StorefrontLocaleUrlSync(): null {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) {
      return;
    }

    const clientLang = getStoredLanguage();
    const urlLang = searchParams.get('lang');

    if (clientLang === PRIMARY_LOCALE) {
      if (urlLang && urlLang !== PRIMARY_LOCALE) {
        return;
      }
      if (urlLang === PRIMARY_LOCALE) {
        const next = new URLSearchParams(searchParams.toString());
        next.delete('lang');
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }
      syncedRef.current = true;
      return;
    }

    if (urlLang === clientLang) {
      syncedRef.current = true;
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.set('lang', clientLang);
    syncedRef.current = true;
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const handleLanguageUpdate = () => {
      syncedRef.current = false;
      const clientLang = getStoredLanguage();
      const next = new URLSearchParams(searchParams.toString());
      if (clientLang === PRIMARY_LOCALE) {
        next.delete('lang');
      } else {
        next.set('lang', clientLang);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [pathname, router, searchParams]);

  return null;
}
