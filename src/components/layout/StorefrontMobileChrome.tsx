import Image from "next/image";

import { LocaleCurrencySwitcher } from "@/components/layout/LocaleCurrencySwitcher";
import { AppLink } from "@/components/ui/AppLink";
import { HomeMobileSearch } from "@/features/home/ui/HomeMobileSearch";
import { getStorefrontCurrencies } from "@/features/settings/application/queries";
import { listEnabledStorefrontCurrencies } from "@/features/settings/domain/store-settings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSelectedCurrency } from "@/lib/money/display-price";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type StorefrontMobileChromeProps = {
  locale: Locale;
  brand: string;
  callLabel: string;
  phoneHref: string;
  languageLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchQuery?: string;
  /** Optional sheet surface (e.g. auth cream). Defaults to white. */
  sheetClassName?: string;
  /** Sheet offset and padding. Home/shop keep the default overlap. */
  sheetSpacingClassName?: string;
  children: React.ReactNode;
};

/**
 * Shared mobile orange chrome (logo / call / locale / search + white sheet)
 * used by home and shop routes to match live degusto-am.
 */
export async function StorefrontMobileChrome({
  locale,
  brand,
  callLabel,
  phoneHref,
  languageLabel,
  searchLabel,
  searchPlaceholder,
  searchQuery = "",
  sheetClassName = "bg-white",
  sheetSpacingClassName = "mt-[87px] min-h-[calc(100dvh-10rem)] px-4 pt-8 pb-[110px]",
  children,
}: StorefrontMobileChromeProps) {
  const dictionary = getDictionary(locale);
  const [currency, storefrontCurrencies] = await Promise.all([
    getSelectedCurrency(),
    getStorefrontCurrencies(),
  ]);
  const enabledCurrencies =
    listEnabledStorefrontCurrencies(storefrontCurrencies);

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip overflow-y-visible bg-[var(--project-color)] lg:hidden">
      <div
        className="pointer-events-none absolute -top-[123px] -left-[210px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-[184px] -right-[160px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D]"
        aria-hidden
      />

      <header className="relative z-[1100] overflow-visible px-4 pt-[max(58px,calc(env(safe-area-inset-top,0px)+12px))]">
        <div className="relative z-20 flex translate-y-5 items-start justify-between overflow-visible">
          <AppLink
            href={`/${locale}`}
            prefetchPolicy="intent"
            className="inline-flex shrink-0"
            aria-label={brand}
          >
            <Image
              src={staticAssetUrl("/assets/mobile/degusto-logo-mobile.webp")}
              alt={brand}
              width={129}
              height={46}
              className="h-[46px] w-[129px] object-contain"
              priority
            />
          </AppLink>
          <div className="flex items-center gap-1">
            <a
              href={phoneHref}
              aria-label={callLabel}
              className="relative inline-flex size-12 items-center justify-center"
            >
              <Image
                src={staticAssetUrl("/assets/mobile/call-btn-bg.webp")}
                alt=""
                width={48}
                height={48}
                className="absolute inset-0 size-12 object-contain"
                aria-hidden
              />
              <Image
                src={staticAssetUrl("/assets/mobile/call-icon.webp")}
                alt=""
                width={23}
                height={23}
                className="relative h-[23px] w-[23px] object-contain"
                aria-hidden
              />
            </a>
            <LocaleCurrencySwitcher
              locale={locale}
              currency={currency}
              currencyLabel={dictionary.header.currency}
              languageLabel={languageLabel}
              enabledCurrencies={enabledCurrencies}
              variant="mobileHome"
            />
          </div>
        </div>

        <div className="relative z-0">
          <HomeMobileSearch
            locale={locale}
            searchLabel={searchLabel}
            placeholder={searchPlaceholder}
            defaultQuery={searchQuery}
          />
        </div>
      </header>

      <div
        className={`relative z-10 rounded-t-[30px] ${sheetSpacingClassName} ${sheetClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
