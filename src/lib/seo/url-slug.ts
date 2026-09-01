const ASCII_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;

const HY_TRANSLITERATION: Record<string, string> = {
  ա: "a",
  բ: "b",
  գ: "g",
  դ: "d",
  ե: "e",
  զ: "z",
  է: "e",
  ը: "y",
  թ: "t",
  ժ: "zh",
  ի: "i",
  լ: "l",
  խ: "kh",
  ծ: "ts",
  կ: "k",
  հ: "h",
  ձ: "dz",
  ղ: "gh",
  ճ: "ch",
  մ: "m",
  յ: "y",
  ն: "n",
  շ: "sh",
  ո: "o",
  չ: "ch",
  պ: "p",
  ջ: "j",
  ռ: "r",
  ս: "s",
  վ: "v",
  տ: "t",
  ր: "r",
  ց: "c",
  ւ: "u",
  փ: "p",
  ք: "k",
  օ: "o",
  ֆ: "f",
  և: "ev",
};

const RU_TRANSLITERATION: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export type UrlSlugSource = {
  slug?: string;
  title?: string;
};

export type UrlSlugTranslations = Partial<
  Record<"en" | "hy" | "ru", UrlSlugSource | undefined>
>;

const LOCALE_ORDER = ["en", "hy", "ru"] as const;

/** True when the value is a shareable SEO slug (`kebab-case` ASCII). */
export function isAsciiSlug(value: string): boolean {
  return ASCII_SLUG_PATTERN.test(value);
}

function transliterateChar(char: string): string {
  const lower = char.toLowerCase();
  return HY_TRANSLITERATION[lower] ?? RU_TRANSLITERATION[lower] ?? char;
}

function transliterate(value: string): string {
  const prepared = value
    .replace(/ու/gi, "u")
    .replace(/եւ/gi, "ev")
    .replace(/և/g, "ev");
  let result = "";
  for (const char of prepared) {
    result += transliterateChar(char);
  }
  return result;
}

/** Builds an ASCII kebab-case slug from any-language title or slug input. */
export function slugifyToAscii(value: string, fallback = "item"): string {
  const slug = transliterate(value)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

  return slug || fallback;
}

/** First stored translation slug that is already ASCII. Prefers English. */
export function pickStoredAsciiSlug(
  translations: UrlSlugTranslations,
): string | null {
  for (const locale of LOCALE_ORDER) {
    const slug = translations[locale]?.slug?.trim();
    if (slug && isAsciiSlug(slug)) {
      return slug;
    }
  }
  return null;
}

/**
 * Canonical storefront URL slug: ASCII, English-first, same on every locale.
 * Falls back to slugifying the English title, then any title.
 */
export function pickCanonicalUrlSlug(
  translations: UrlSlugTranslations,
  fallback: string,
): string {
  const stored = pickStoredAsciiSlug(translations);
  if (stored) {
    return stored;
  }

  for (const locale of LOCALE_ORDER) {
    const title = translations[locale]?.title?.trim();
    if (title) {
      return slugifyToAscii(title, fallback);
    }
  }

  return fallback;
}

/** Distinct stored slugs used to keep old Unicode URLs resolvable. */
export function collectStoredSlugs(
  translations: UrlSlugTranslations,
): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const locale of LOCALE_ORDER) {
    const slug = translations[locale]?.slug?.trim();
    if (!slug || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
}
