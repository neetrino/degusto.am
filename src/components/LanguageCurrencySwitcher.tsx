'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CURRENCIES,
  getStoredCurrency,
  HYDRATION_SAFE_CURRENCY,
  setStoredCurrency,
  type CurrencyCode,
} from '../lib/currency';
import {
  getStoredLanguage,
  HYDRATION_SAFE_LANGUAGE,
  setStoredLanguage,
  type LanguageCode,
} from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import {
  MOBILE_FIGMA_HEADER_SWITCHER_DROPDOWN_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_SWITCHER_OPEN_STACKING_CLASS,
} from '@/constants/mobile-figma-storefront';

const LANGUAGE_CODES: LanguageCode[] = ['en', 'hy', 'ru'];
const CURRENCY_CODES: CurrencyCode[] = ['AMD', 'USD', 'EUR', 'RUB', 'GEL'];

const SWITCHER_DROPDOWN_OPTION_BUTTON_CLASS =
  'inline-flex w-full min-h-[2rem] flex-row flex-nowrap items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1 text-sm font-semibold transition-colors';

type SwitcherVariant = 'desktop' | 'mobile';

const SWITCHER_ARROW_DOWN_CLASS = 'object-contain';

interface LanguageCurrencySwitcherProps {
  variant: SwitcherVariant;
  iconSrc: string;
  /** When omitted, a built-in chevron is rendered (avoids expired remote asset URLs). */
  arrowSrc?: string;
}

function SwitcherChevronIcon({ className }: { className: string }) {
  return (
    <svg
      width={8}
      height={5}
      viewBox="0 0 8 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M1 1L4 4L7 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LanguageCurrencySwitcher({
  variant,
  iconSrc,
  arrowSrc,
}: LanguageCurrencySwitcherProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(HYDRATION_SAFE_LANGUAGE);
  const [currency, setCurrency] = useState<CurrencyCode>(HYDRATION_SAFE_CURRENCY);
  const switcherRef = useRef<HTMLDivElement>(null);
  const currentCurrencyInfo = CURRENCIES[currency];

  useEffect(() => {
    setLanguage(getStoredLanguage());
    setCurrency(getStoredCurrency());
  }, []);

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
      ? 'relative inline-flex h-12 w-[8.75rem] shrink-0 items-center justify-center overflow-hidden rounded-[70px] bg-[#f55c0a] px-3 text-sm font-bold leading-[18px] text-white xl:w-[159px] xl:px-[18px] xl:text-base'
      : 'relative inline-flex h-12 w-[159px] items-center rounded-[70px] bg-white px-[19px]';

  const labelClassName =
    variant === 'desktop'
      ? 'ml-[2px] min-w-0 shrink truncate text-sm font-bold leading-[18px] text-white xl:text-base'
      : 'ml-[2px] text-base font-bold leading-[18px] text-[#ff7f20]';

  const dropdownLabelClassName =
    variant === 'desktop' ? 'text-xs font-semibold text-[#f55c0a]' : 'text-xs font-semibold text-[#ff7f20]';
  const contentClassName =
    variant === 'desktop'
      ? 'inline-flex -translate-x-[6px] items-center justify-center gap-[2px]'
      : 'inline-flex items-center justify-center';
  const arrowClassName =
    variant === 'desktop'
      ? `absolute right-2.5 h-[5px] w-2 shrink-0 xl:right-[18px] ${SWITCHER_ARROW_DOWN_CLASS}`
      : `absolute right-[20px] h-[5px] w-2 ${SWITCHER_ARROW_DOWN_CLASS}`;

  const dropdownPositionClassName =
    variant === 'mobile'
      ? `absolute right-0 top-full ${MOBILE_FIGMA_HEADER_SWITCHER_DROPDOWN_STACKING_CLASS} mt-2 max-h-[min(420px,calc(100vh-120px))] w-[216px] overflow-y-auto rounded-2xl border border-[#ececec] bg-white p-2 shadow-2xl`
      : 'absolute right-0 top-full z-[60] mt-2 w-[216px] rounded-2xl border border-[#ececec] bg-white p-2 shadow-xl';

  const mobileOpenStackingClassName =
    variant === 'mobile' && isOpen ? MOBILE_FIGMA_HEADER_SWITCHER_OPEN_STACKING_CLASS : '';

  const currencyDisplayLabel = `${currency} ${currentCurrencyInfo.symbol}`;

  return (
    <div className={`relative ${mobileOpenStackingClassName}`.trim()} ref={switcherRef}>
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
          <img
            src={iconSrc}
            alt=""
            className={`h-[19px] w-[19px] shrink-0 object-contain ${
              variant === 'desktop' ? 'brightness-0 invert' : 'brightness-0'
            }`}
          />
          <span className={labelClassName}>
            {language.toUpperCase()} / {currencyDisplayLabel}
          </span>
        </span>
        {arrowSrc ? (
          <img src={arrowSrc} alt="" className={arrowClassName} />
        ) : (
          <SwitcherChevronIcon
            className={`${arrowClassName} text-white ${variant === 'mobile' ? 'text-[#ff7f20]' : ''}`}
          />
        )}
      </button>

      {isOpen ? (
        <div className={dropdownPositionClassName}>
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
                    className={`${SWITCHER_DROPDOWN_OPTION_BUTTON_CLASS} ${
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
                    className={`${SWITCHER_DROPDOWN_OPTION_BUTTON_CLASS} ${
                      isSelected
                        ? 'bg-[#ff7f20] text-white'
                        : 'bg-[#f4f4f5] text-[#2f2f2f] hover:bg-[#e9e9eb]'
                    }`}
                  >
                    {`${code} ${CURRENCIES[code].symbol}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
