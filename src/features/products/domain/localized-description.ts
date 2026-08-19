import type { Locale } from "@/lib/i18n/config";

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
