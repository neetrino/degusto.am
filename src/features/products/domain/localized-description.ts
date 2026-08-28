import { locales, type Locale } from "@/lib/i18n/config";

type DescriptionScript = Locale | "unknown";

const ARMENIAN_LETTER = /[\u0531-\u0587]/g;
const CYRILLIC_LETTER = /[\u0400-\u04FF]/g;
const LATIN_LETTER = /[A-Za-z]/g;

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function stripMarkup(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ");
}

function classifyDescriptionScript(html: string): DescriptionScript {
  const text = stripMarkup(html);
  const armenian = countMatches(text, ARMENIAN_LETTER);
  const cyrillic = countMatches(text, CYRILLIC_LETTER);
  const latin = countMatches(text, LATIN_LETTER);
  const highest = Math.max(armenian, cyrillic, latin);

  if (highest === 0) {
    return "unknown";
  }
  if (armenian === highest) {
    return "hy";
  }
  if (cyrillic === highest) {
    return "ru";
  }
  return "en";
}

function extractParagraphs(html: string): string[] {
  const paragraphRegex = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  return html.match(paragraphRegex) ?? [];
}

/** True when HTML holds multiple paragraphs in different scripts (hy/ru/en). */
export function isMixedLocaleDescription(html: string): boolean {
  const paragraphs = extractParagraphs(html.trim());
  if (paragraphs.length <= 1) {
    return false;
  }
  const scripts = new Set(
    paragraphs
      .map((paragraph) => classifyDescriptionScript(paragraph))
      .filter((script): script is Locale => script !== "unknown"),
  );
  return scripts.size > 1;
}

/**
 * When a product description stores hy/ru/en in one HTML blob, keep the
 * paragraph that matches the active storefront locale.
 */
export function pickLocalizedProductDescription(
  html: string,
  locale: Locale,
): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return "";
  }

  const paragraphs = extractParagraphs(trimmed);
  if (paragraphs.length <= 1) {
    return trimmed;
  }

  const matched = paragraphs.find(
    (paragraph) => classifyDescriptionScript(paragraph) === locale,
  );
  return matched ?? paragraphs[0] ?? trimmed;
}

/** Locale-specific description without markup, for metadata and JSON-LD. */
export function productDescriptionPlainText(
  html: string,
  locale: Locale,
): string {
  return stripMarkup(pickLocalizedProductDescription(html, locale))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a legacy multi-language HTML description into per-locale plain text.
 * Returns null when the value is not a mixed hy/ru/en blob.
 */
export function splitLocalizedProductDescriptions(
  html: string,
): Record<Locale, string> | null {
  const trimmed = html.trim();
  if (!trimmed || !isMixedLocaleDescription(trimmed)) {
    return null;
  }

  const next = {} as Record<Locale, string>;
  for (const locale of locales) {
    next[locale] = productDescriptionPlainText(trimmed, locale);
  }
  return next;
}
