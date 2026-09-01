import { pickCanonicalUrlSlug, pickStoredAsciiSlug } from "@/lib/seo/url-slug";
import type { UrlSlugTranslations } from "@/lib/seo/url-slug";

const TITLE_SLUG_RULES: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /pizza|պիցցա|пицц/i, slug: "pizza" },
  { pattern: /shawarma|շաուրմա|шаурм/i, slug: "shawarma" },
  { pattern: /soup|ապուր|суп|տաք ուտեստ/i, slug: "soups-hot-dishes" },
  { pattern: /salad|աղցան|салат/i, slug: "salads" },
  { pattern: /lahmaj|լահմաջ|лахмадж/i, slug: "lahmajoun" },
  { pattern: /khachapur|խաչապուր|хачапур/i, slug: "khachapuri" },
  { pattern: /khorovat|խորոված|мангал|барбекю/i, slug: "khorovats" },
  { pattern: /khinkal|խինկալ|хинкал/i, slug: "khinkali" },
  { pattern: /potato|կարտոֆիլ|картоф/i, slug: "stuffed-potato" },
  { pattern: /burger|սենդվիչ|бургер|сэндвич/i, slug: "burgers-sandwiches" },
  { pattern: /pancake|կարկանդակ|նրբաբլիթ|блин/i, slug: "cakes-pancakes" },
  { pattern: /combo|կոմբո|комбо/i, slug: "combo-packages" },
  { pattern: /lunch|լանչ|ланч/i, slug: "lunch-boxes" },
  { pattern: /grill|գրիլ|ապխտած|гриль/i, slug: "grill-smoked" },
  { pattern: /bread|հաց|хлеб/i, slug: "bread" },
  { pattern: /pastry|խմորեղեն|выпечк/i, slug: "pastry" },
  { pattern: /egg|ձվածեղ|яичн/i, slug: "fried-eggs" },
  { pattern: /lent|պահք|постн/i, slug: "lenten-dishes" },
  { pattern: /sushi|ասիական|суши/i, slug: "asian-sushi" },
  { pattern: /pasta|պաստա|паст/i, slug: "pasta" },
  { pattern: /sauce|սոուս|соус/i, slug: "sauces" },
  { pattern: /restaurant|ռեստորան|ресторан/i, slug: "restaurant" },
  { pattern: /alcohol|ալկոհոլ|алкогол/i, slug: "bar-alcohol" },
  { pattern: /juice|հյութ|ըմպելիք|сок|напит/i, slug: "juices-drinks" },
  { pattern: /semi|կիսաֆաբրիկ|полуфабр/i, slug: "semi-finished" },
  { pattern: /mexican|մեքսիկ|мексик/i, slug: "mexican" },
  { pattern: /^(bar|բար|бар)$/i, slug: "bar" },
];

/** Maps a known catalog title to a stable English URL slug. */
export function suggestEnglishCategorySlug(title: string): string | null {
  const haystack = title.trim();
  if (!haystack) {
    return null;
  }
  for (const rule of TITLE_SLUG_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule.slug;
    }
  }
  return null;
}

/**
 * Storefront category slug: stored ASCII, then known English name, then slugified title.
 */
export function canonicalCategorySlug(
  translations: UrlSlugTranslations,
): string {
  const stored = pickStoredAsciiSlug(translations);
  if (stored) {
    return stored;
  }

  for (const locale of ["en", "hy", "ru"] as const) {
    const suggested = suggestEnglishCategorySlug(
      translations[locale]?.title ?? "",
    );
    if (suggested) {
      return suggested;
    }
  }

  return pickCanonicalUrlSlug(translations, "category");
}
