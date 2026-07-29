"use client";

import { locales, type Locale } from "@/lib/i18n/config";

type AdminContentLocaleToggleProps = {
  value: Locale;
  onChange: (locale: Locale) => void;
  /** Locales that already have title + slug filled. */
  filledLocales?: ReadonlyArray<Locale>;
  disabled?: boolean;
  className?: string;
};

/** DEC-017 content locale selector — one field set, switch active language. */
export function AdminContentLocaleToggle({
  value,
  onChange,
  filledLocales = [],
  disabled = false,
  className = "",
}: AdminContentLocaleToggleProps) {
  const filled = new Set(filledLocales);

  return (
    <div
      className={`inline-flex rounded-full border border-[#ead7bf] bg-[#fffaf2] p-1 ${className}`}
      role="tablist"
      aria-label="Content language"
    >
      {locales.map((locale) => {
        const active = value === locale;
        const isFilled = filled.has(locale);
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(locale)}
            className={`relative min-w-[3.25rem] rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-[#ff7f20] text-white shadow-sm"
                : "text-[#5c564e] hover:bg-white hover:text-[#1f1a17]"
            } disabled:opacity-50`}
          >
            {locale}
            {isFilled && !active ? (
              <span
                className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-500"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
