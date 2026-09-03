"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChevronDown, Globe } from "lucide-react";

import { DROPDOWN_ANIMATION_MS } from "@/components/ui/SelectDropdown";
import { setCurrencyAction } from "@/features/preferences/set-currency-action";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

const HOVER_CLOSE_DELAY_MS = 140;

/** Short codes for the navbar trigger (MaMarie-style `AMD / HY`). */
const localeShortLabels: Record<Locale, string> = {
  hy: "HY",
  en: "EN",
  ru: "RU",
};

type LocaleCurrencySwitcherProps = {
  locale: Locale;
  currency: Currency;
  currencyLabel: string;
  languageLabel: string;
  /** Enabled storefront currencies. One or fewer → language-only UI. */
  enabledCurrencies: readonly Currency[];
  variant?: "default" | "degusto" | "mobileHome";
};

function replaceLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (segments.length > 1) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

function optionClassName(selected: boolean): string {
  return selected
    ? "flex h-9 w-full items-center justify-center whitespace-nowrap rounded-[30px] px-3 text-center text-sm font-semibold text-white bg-[#ff7f20] transition-colors"
    : "flex h-9 w-full items-center justify-center whitespace-nowrap rounded-[30px] px-3 text-center text-sm font-medium text-[#3c2f2f] transition-colors hover:bg-[#fff5ed] hover:text-[#ff7f20]";
}

function mobileHomeTriggerClassName(open: boolean, compact: boolean): string {
  const widthClass = compact ? "w-auto min-w-0" : "w-[159px]";
  return open
    ? `relative inline-flex h-12 ${widthClass} items-center justify-between gap-1.5 rounded-[70px] bg-[#ff7f20] px-3 text-white shadow-[0_8px_20px_rgba(255,127,32,0.35)]`
    : `relative inline-flex h-12 ${widthClass} items-center justify-between gap-1.5 rounded-[70px] bg-white px-3 text-[#ff7f20] shadow-[0_4px_14px_rgba(60,47,47,0.1)]`;
}

function degustoTriggerClassName(compact: boolean): string {
  return compact
    ? "flex h-12 w-auto shrink-0 items-center gap-1.5 rounded-full bg-brand-strong px-3 text-white transition hover:bg-brand"
    : "flex h-12 w-[159px] shrink-0 items-center gap-2 rounded-full bg-brand-strong px-4 text-white transition hover:bg-brand";
}

function defaultTriggerClassName(compact: boolean): string {
  return compact
    ? "flex h-9 w-auto shrink-0 items-center rounded-full border border-gray-200 bg-white py-0 pr-2.5 pl-2.5 text-gray-700 transition-colors hover:bg-gray-50"
    : "flex h-9 w-[calc(2.75rem*3+0.5rem*2-0.75rem)] shrink-0 items-center rounded-full border border-gray-200 bg-white py-0 pr-3 pl-3 text-gray-700 transition-colors hover:bg-gray-50";
}

/**
 * Combined currency + language control matching MaMarie navbar.
 * When fewer than two currencies are enabled, only language is shown.
 */
export function LocaleCurrencySwitcher({
  locale,
  currency,
  currencyLabel,
  languageLabel,
  enabledCurrencies,
  variant = "default",
}: LocaleCurrencySwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const showCurrency = enabledCurrencies.length > 1;

  const clearCloseTimer = useCallback((): void => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  function openMenu(): void {
    clearCloseTimer();
    setOpen(true);
  }

  const closeMenu = useCallback((): void => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  function scheduleClose(): void {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const syncHoverCapability = (): void => setCanHover(mediaQuery.matches);
    syncHoverCapability();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncHoverCapability);
      return () => {
        mediaQuery.removeEventListener("change", syncHoverCapability);
      };
    }

    mediaQuery.addListener(syncHoverCapability);
    return () => {
      mediaQuery.removeListener(syncHoverCapability);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (open) {
      let frame2 = 0;
      queueMicrotask(() => {
        if (cancelled) return;
        setRendered(true);
        setEntered(false);
      });
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          if (!cancelled) setEntered(true);
        });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame1);
        cancelAnimationFrame(frame2);
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setEntered(false);
    });
    const timer = setTimeout(() => setRendered(false), DROPDOWN_ANIMATION_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMenu]);

  function selectCurrency(next: Currency): void {
    if (next === currency) {
      closeMenu();
      return;
    }
    startTransition(async () => {
      await setCurrencyAction(next);
      closeMenu();
      router.refresh();
    });
  }

  function selectLocale(next: Locale): void {
    if (next === locale) {
      closeMenu();
      return;
    }
    closeMenu();
    router.push(replaceLocaleInPath(pathname, next));
  }

  const isMobileHome = variant === "mobileHome";
  const isDegusto = variant === "degusto";
  const compact = !showCurrency;
  const triggerLabel = showCurrency
    ? `${localeShortLabels[locale]} / ${currency}`
    : localeShortLabels[locale];

  return (
    <div
      ref={rootRef}
      className={open || rendered ? "relative z-[300]" : "relative z-0"}
      onMouseEnter={canHover ? openMenu : undefined}
      onMouseLeave={canHover ? scheduleClose : undefined}
    >
      <button
        type="button"
        className={
          isMobileHome
            ? mobileHomeTriggerClassName(open, compact)
            : isDegusto
              ? degustoTriggerClassName(compact)
              : defaultTriggerClassName(compact)
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        aria-label={triggerLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        {isMobileHome ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <Globe className="size-[19px] shrink-0" strokeWidth={2} aria-hidden />
            <span className="truncate text-sm leading-[18px] font-bold">
              {showCurrency ? (
                <>
                  {localeShortLabels[locale]} / {currency}
                  {currency === "AMD" ? " Դ" : ""}
                </>
              ) : (
                localeShortLabels[locale]
              )}
            </span>
          </span>
        ) : isDegusto ? (
          <Globe className="size-[19px] shrink-0" aria-hidden />
        ) : null}
        {!isMobileHome ? (
          <span
            className={
              isDegusto
                ? compact
                  ? "flex items-center justify-center whitespace-nowrap text-base font-bold leading-[18px] capitalize"
                  : "flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap text-base font-bold leading-[18px] capitalize"
                : compact
                  ? "flex items-center justify-center whitespace-nowrap text-[15px] font-bold leading-none tabular-nums"
                  : "flex min-w-0 flex-1 items-center justify-center whitespace-nowrap text-[15px] font-bold leading-none tabular-nums"
            }
          >
            {showCurrency ? (
              isDegusto ? (
                <>
                  <span>{localeShortLabels[locale]}</span>
                  <span>/</span>
                  <span>{currency}</span>
                </>
              ) : (
                <>
                  <span>{currency}</span>
                  <span className="inline-block w-[2px]" aria-hidden />
                  <span>/</span>
                  <span className="inline-block w-[2px]" aria-hidden />
                  <span>{localeShortLabels[locale]}</span>
                </>
              )
            ) : (
              localeShortLabels[locale]
            )}
          </span>
        ) : null}
        <ChevronDown
          className={
            isMobileHome
              ? `h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180 text-white" : "text-[#ff7f20]"}`
              : isDegusto
                ? `h-4 w-4 shrink-0 text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : ""}`
                : `h-4 w-4 shrink-0 text-gray-500 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : ""}`
          }
          aria-hidden
        />
      </button>

      {rendered ? (
        <div
          id={menuId}
          role="dialog"
          aria-label={
            showCurrency
              ? `${currencyLabel} / ${languageLabel}`
              : languageLabel
          }
          className={`absolute right-0 top-full z-[310] origin-top pt-2 transition-[opacity,transform] ease-out ${
            entered
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
          style={{ transitionDuration: `${DROPDOWN_ANIMATION_MS}ms` }}
        >
          <div className="flex h-fit w-max items-start overflow-hidden rounded-[20px] border border-[#dedede] bg-white pt-2.5 pb-2 shadow-[0_18px_44px_rgba(60,47,47,0.14)]">
            {showCurrency ? (
              <div className="w-max border-r border-[#dedede]">
                <p className="whitespace-nowrap px-3 pb-1 text-center text-[11px] font-medium tracking-[0.2px] text-[#717182] uppercase">
                  {currencyLabel}
                </p>
                <ul
                  role="listbox"
                  aria-label={currencyLabel}
                  className="space-y-0.5 px-1.5"
                >
                  {enabledCurrencies.map((code) => {
                    const selected = code === currency;
                    return (
                      <li key={code} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          disabled={pending}
                          className={optionClassName(selected)}
                          onClick={() => selectCurrency(code)}
                        >
                          {code}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div className="w-max">
              <p className="whitespace-nowrap px-3 pb-1 text-center text-[11px] font-medium tracking-[0.2px] text-[#717182] uppercase">
                {languageLabel}
              </p>
              <ul
                role="listbox"
                aria-label={languageLabel}
                className="space-y-0.5 px-1.5"
              >
                {locales.map((code) => {
                  const selected = code === locale;
                  return (
                    <li key={code} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        className={optionClassName(selected)}
                        aria-label={`${localeShortLabels[code]}: ${localeLabels[code]}`}
                        onClick={() => selectLocale(code)}
                      >
                        {localeLabels[code]}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
