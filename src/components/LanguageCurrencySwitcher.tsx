'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CURRENCIES,
  getStoredCurrency,
  setStoredCurrency,
  type CurrencyCode,
} from '../lib/currency';
import {
  getStoredLanguage,
  LANGUAGES,
  setStoredLanguage,
  type LanguageCode,
} from '../lib/language';
import { useTranslation } from '../lib/i18n-client';

const LANGUAGE_CODES: LanguageCode[] = ['en', 'hy', 'ru'];
const CURRENCY_CODES: CurrencyCode[] = ['AMD', 'USD', 'EUR', 'RUB', 'GEL'];

type SwitcherVariant = 'desktop' | 'mobile';

interface LanguageCurrencySwitcherProps {
  variant: SwitcherVariant;
  iconSrc: string;
  arrowSrc: string;
}

export function LanguageCurrencySwitcher({
  variant,
  iconSrc,
  arrowSrc,
}: LanguageCurrencySwitcherProps) {
  const { t, lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => getStoredLanguage());
  const [currency, setCurrency] = useState<CurrencyCode>(() => getStoredCurrency());
  const switcherRef = useRef<HTMLDivElement>(null);
  const currentCurrencyInfo = CURRENCIES[currency];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(getStoredLanguage());
    };
    const updateCurrency = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('language-updated', updateLanguage);
    window.addEventListener('currency-updated', updateCurrency);

    return () => {
      window.removeEventListener('language-updated', updateLanguage);
      window.removeEventListener('currency-updated', updateCurrency);
    };
  }, []);

  const buttonClassName =
    variant === 'desktop'
      ? 'relative inline-flex h-12 w-[159px] shrink-0 items-center justify-center overflow-hidden rounded-[70px] bg-[#f55c0a] px-[18px] text-base font-bold leading-[18px] text-white'
      : 'relative inline-flex h-12 w-[159px] items-center rounded-[70px] bg-white px-[19px]';

  const labelClassName =
    variant === 'desktop'
      ? 'ml-[2px] shrink-0 text-base font-bold leading-[18px] text-white'
      : 'ml-[2px] text-base font-bold leading-[18px] text-[#ff7f20]';

  const dropdownLabelClassName =
    variant === 'desktop' ? 'text-xs font-semibold text-[#f55c0a]' : 'text-xs font-semibold text-[#ff7f20]';
  const contentClassName =
    variant === 'desktop'
      ? 'inline-flex -translate-x-[6px] items-center justify-center gap-[2px]'
      : 'inline-flex items-center justify-center';
  const arrowClassName =
    variant === 'desktop'
      ? 'absolute right-[18px] h-3 w-2 shrink-0 rotate-90 object-contain'
      : 'absolute right-[20px] h-[10px] w-[4px] rotate-90 object-contain';
  const currencyLabelByLanguage: Record<LanguageCode, Record<CurrencyCode, string>> = {
    en: {
      AMD: 'Armenian Dram',
      USD: 'US Dollar',
      EUR: 'Euro',
      RUB: 'Russian Ruble',
      GEL: 'Georgian Lari',
    },
    hy: {
      AMD: 'Հայկական դրամ',
      USD: 'ԱՄՆ դոլար',
      EUR: 'Եվրո',
      RUB: 'Ռուսական ռուբլի',
      GEL: 'Վրացական լարի',
    },
    ru: {
      AMD: 'Армянский драм',
      USD: 'Доллар США',
      EUR: 'Евро',
      RUB: 'Российский рубль',
      GEL: 'Грузинский лари',
    },
  };

  return (
    <div className="relative" ref={switcherRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prevState) => !prevState);
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={buttonClassName}
      >
        <span className={contentClassName}>
          <img src={iconSrc} alt="" className="h-[19px] w-[19px] shrink-0 object-contain" />
          <span className={labelClassName}>
            {language.toUpperCase()} / {currency} {currentCurrencyInfo.symbol}
          </span>
        </span>
        <img src={arrowSrc} alt="" className={arrowClassName} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[216px] rounded-2xl border border-[#ececec] bg-white p-2 shadow-xl">
          <div className="px-2 pb-1">
            <p className={dropdownLabelClassName}>{t('common.switcher.language')}</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {LANGUAGE_CODES.map((code) => {
                const isSelected = code === language;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        setLanguage(code);
                        setStoredLanguage(code);
                      }
                      setIsOpen(false);
                    }}
                    className={`rounded-lg px-2 py-1 text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[#ff7f20] text-white'
                        : 'bg-[#f4f4f5] text-[#2f2f2f] hover:bg-[#e9e9eb]'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 border-t border-[#efefef] px-2 pt-2">
            <p className={dropdownLabelClassName}>{t('common.switcher.currency')}</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {CURRENCY_CODES.map((code) => {
                const isSelected = code === currency;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        setCurrency(code);
                        setStoredCurrency(code);
                      }
                      setIsOpen(false);
                    }}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[#ff7f20] text-white'
                        : 'bg-[#f4f4f5] text-[#2f2f2f] hover:bg-[#e9e9eb]'
                    }`}
                  >
                    {code} {CURRENCIES[code].symbol}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 px-1 text-[11px] leading-4 text-[#6b7280]">
              {currencyLabelByLanguage[lang][currency]}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
