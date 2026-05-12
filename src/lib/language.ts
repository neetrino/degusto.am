// Language utilities
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hy: { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = 'shop_language';
const LANGUAGE_COOKIE_KEY = 'shop_language';

export function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'hy';
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in LANGUAGES) {
      return stored as LanguageCode;
    }
  } catch {
    // Ignore errors
  }
  return 'hy';
}

export function setStoredLanguage(language: LanguageCode, options?: { forceReload?: boolean }): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event('language-updated'));
    if (options?.forceReload) {
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  } catch (error) {
    console.error('Failed to save language:', error);
  }
}

