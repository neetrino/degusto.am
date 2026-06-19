'use client';

/**
 * Client-side i18n React context and hooks.
 * Use LanguageProvider at the app root; consume via useTranslation / useLanguage.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getStoredLanguage,
  HYDRATION_SAFE_LANGUAGE,
  type LanguageCode,
} from './language';
import {
  t as translate,
  getProductText,
  getAttributeLabel,
  clearTranslationCache,
  type ProductField,
} from './i18n';

type TranslationContextValue = {
  lang: LanguageCode;
  t: (path: string) => string;
  getProductText: (productId: string, field: ProductField) => string;
  getAttributeLabel: (type: string, value: string) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function warnInvalidPath(path: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[i18n] useTranslation: Invalid path provided to t()', path);
  }
}

/**
 * Provides reactive language state for the entire client tree.
 * Listens to `language-updated` from setStoredLanguage (no page reload).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>(HYDRATION_SAFE_LANGUAGE);

  useEffect(() => {
    const syncLanguage = () => {
      const storedLang = getStoredLanguage();
      setLang((currentLang) => {
        if (storedLang !== currentLang) {
          clearTranslationCache();
          return storedLang;
        }
        return currentLang;
      });
    };

    syncLanguage();
    window.addEventListener('language-updated', syncLanguage);
    return () => {
      window.removeEventListener('language-updated', syncLanguage);
    };
  }, []);

  const t = useCallback(
    (path: string) => {
      if (!path || typeof path !== 'string') {
        warnInvalidPath(path);
        return '';
      }
      return translate(lang, path);
    },
    [lang]
  );

  const getProduct = useCallback(
    (productId: string, field: ProductField) => {
      if (!productId || typeof productId !== 'string') {
        return '';
      }
      return getProductText(lang, productId, field);
    },
    [lang]
  );

  const getAttribute = useCallback(
    (type: string, value: string) => {
      if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
        return value || '';
      }
      return getAttributeLabel(lang, type, value);
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      t,
      getProductText: getProduct,
      getAttributeLabel: getAttribute,
    }),
    [lang, t, getProduct, getAttribute]
  );

  return createElement(TranslationContext.Provider, { value }, children);
}

/**
 * React hook for translations in client components.
 * Automatically handles language updates and memoization.
 */
export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}

/** Current storefront language from context (reactive on header switch). */
export function useLanguage(): LanguageCode {
  return useTranslation().lang;
}
