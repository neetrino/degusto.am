import { HIDDEN_STOREFRONT_CATEGORY_SLUGS } from '@/constants/hidden-storefront-category-slugs';
import type { MenuCard } from '@/components/home/menu-types';
import { resolveFoodAttributeFlagsFromVariants } from '@/lib/product-food-attributes';
import { resolveMenuCardCompareAtPrice } from '@/lib/storefront/menu-card-pricing';
import { isPublishedVariantInStock } from '@/lib/storefront/variant-in-stock';
import { resolveStorefrontProductImageFromMedia } from '@/constants/storefront-product-image';
import { processImageUrl, type ImageUrlInput } from '@/lib/utils/image-utils';

const HY_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  "soups-hot-dishes": "Ապուրներ եւ տաք ուտեստներ",
  salads: "Աղցաններ",
  shawarma: "Շաուրմա",
  pizza: "Պիցցա",
  lahmajoun: "Լահմաջո",
  khachapuri: "Վրացական Խաչապուրի",
  khorovats: "Խորոված",
  khinkali: "Խինկալի",
  "stuffed-potato": "Լցոնած կարտոֆիլ",
  "burgers-sandwiches": "Բուրգերներ եւ սենդվիչներ",
  "cakes-pancakes": "Կարկանդակներ եւ նրբաբլիթներ",
  "combo-packages": "Կոմբո փաթեթներ",
  "lunch-boxes": "Լանչ Բոքսեր",
  "grill-smoked": "Գրիլ եւ ապխտած արտադրանքներ",
  bread: "Հաց",
  pastry: "Խմորեղեն",
  "fried-eggs": "Ձվածեղ",
  "lenten-dishes": "Պահքի ուտեստներ",
  "asian-sushi": "Ասիական խոհանոց (Սուշի)",
  pasta: "Պաստաներ",
  sauces: "Սոուսներ",
  restaurant: "Ռեստորան",
  "bar-alcohol": "Բար (Ալկոհոլ)",
  "juices-drinks": "Հյութեր և Ըմպելիքներ",
  "semi-finished": "Կիսաֆաբրիկատներ",
  mexican: "Մեքսիկական խոհանոց",
};

const EN_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  "soups-hot-dishes": "Soups and hot dishes",
  salads: "Salads",
  shawarma: "Shawarma",
  pizza: "Pizza",
  lahmajoun: "Lahmajo",
  khachapuri: "Georgian Khachapuri",
  khorovats: "BBQ",
  khinkali: "Khinkali",
  "stuffed-potato": "Stuffed potato",
  "burgers-sandwiches": "Burgers and sandwiches",
  "cakes-pancakes": "Pies and pancakes",
  "combo-packages": "Combo sets",
  "lunch-boxes": "Lunch boxes",
  "grill-smoked": "Grill and smoked products",
  bread: "Bread",
  pastry: "Pastry",
  "fried-eggs": "Fried eggs",
  "lenten-dishes": "Lenten dishes",
  "asian-sushi": "Asian cuisine (Sushi)",
  pasta: "Pastas",
  sauces: "Sauces",
  restaurant: "Restaurant",
  "bar-alcohol": "Bar (Alcohol)",
  "juices-drinks": "Juices and drinks",
  "semi-finished": "Semi-finished products",
  mexican: "Mexican cuisine",
};

const RU_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  "soups-hot-dishes": "Супы и горячие блюда",
  salads: "Салаты",
  shawarma: "Шаурма",
  pizza: "Пицца",
  lahmajoun: "Лахмаджо",
  khachapuri: "Грузинский хачапури",
  khorovats: "Шашлык",
  khinkali: "Хинкали",
  "stuffed-potato": "Фаршированный картофель",
  "burgers-sandwiches": "Бургеры и сэндвичи",
  "cakes-pancakes": "Пироги и блины",
  "combo-packages": "Комбо-наборы",
  "lunch-boxes": "Ланч-боксы",
  "grill-smoked": "Гриль и копченые продукты",
  bread: "Хлеб",
  pastry: "Выпечка",
  "fried-eggs": "Яичница",
  "lenten-dishes": "Постные блюда",
  "asian-sushi": "Азиатская кухня (Суши)",
  pasta: "Паста",
  sauces: "Соусы",
  restaurant: "Ресторан",
  "bar-alcohol": "Бар (Алкоголь)",
  "juices-drinks": "Соки и напитки",
  "semi-finished": "Полуфабрикаты",
  mexican: "Мексиканская кухня",
};

const SHOP_ALL_CATEGORY_ICON_URL = '/categories/figma/all.svg';

export type ShopCategoryEntry = {
  id: string;
  slug: string;
  title: string;
  iconUrl: string | null;
};

type CategoryTranslationRow = {
  locale: string;
  title: string;
  slug: string;
};

type CategoryDbRow = {
  id: string;
  media: unknown;
  translations: CategoryTranslationRow[];
};

export type ShopMenuProductRow = {
  id: string;
  discountPercent: number | null;
  media: unknown;
  ratingSummary?: {
    avgRating: number;
    reviewCount: number;
  };
  categories: Array<{
    translations: CategoryTranslationRow[];
  }>;
  translations: Array<{
    locale: string;
    title: string;
    subtitle: string | null;
    slug: string;
  }>;
  variants: Array<{
    id: string;
    published: boolean;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    attributes: unknown;
  }>;
  _count?: {
    variants?: number;
    reviews?: number;
  };
};

export function toShopMenuImageUrl(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  return processImageUrl(media[0] as ImageUrlInput);
}

export function resolveShopCategoryTitle(
  currentLocale: string,
  translation: CategoryTranslationRow
): string {
  const normalizedLocale = currentLocale.toLowerCase();

  if (normalizedLocale.startsWith('en')) {
    return EN_CATEGORY_TITLE_BY_SLUG[translation.slug] || translation.title;
  }
  if (normalizedLocale.startsWith('ru')) {
    return RU_CATEGORY_TITLE_BY_SLUG[translation.slug] || translation.title;
  }
  if (normalizedLocale.startsWith('hy')) {
    if (translation.locale.toLowerCase().startsWith('hy')) {
      return translation.title;
    }
    return HY_CATEGORY_TITLE_BY_SLUG[translation.slug] || translation.title;
  }

  return translation.title;
}

export function buildShopCategoryEntries(
  locale: string,
  allCategoriesLabel: string,
  categoryRows: CategoryDbRow[]
): ShopCategoryEntry[] {
  const entries: ShopCategoryEntry[] = [
    {
      id: 'all',
      slug: '',
      title: allCategoriesLabel,
      iconUrl: SHOP_ALL_CATEGORY_ICON_URL,
    },
  ];

  for (const row of categoryRows) {
    const translation =
      row.translations.find((item) => item.locale === locale) ?? row.translations[0];
    if (!translation?.slug || !translation.title) {
      continue;
    }
    if (HIDDEN_STOREFRONT_CATEGORY_SLUGS.has(translation.slug.toLowerCase())) {
      continue;
    }

    entries.push({
      id: row.id,
      slug: translation.slug,
      title: resolveShopCategoryTitle(locale, translation),
      iconUrl: toShopMenuImageUrl(row.media),
    });
  }

  return entries;
}

export function mapShopProductRowsToMenuCards(
  locale: string,
  productRows: ShopMenuProductRow[]
): MenuCard[] {
  return productRows.map((row, index) => {
    const translation =
      row.translations.find((item) => item.locale === locale) ?? row.translations[0];
    const categoryTranslation =
      row.categories[0]?.translations.find((item) => item.locale === locale) ??
      row.categories[0]?.translations[0];
    const variant = row.variants[0];
    const price = variant?.price ?? 0;
    const oldPrice = resolveMenuCardCompareAtPrice(price, variant?.compareAtPrice);
    const hasVariantChoice = (row._count?.variants ?? row.variants.length) > 1;
    const reviewCount = row.ratingSummary?.reviewCount ?? row._count?.reviews ?? 0;
    const rating = reviewCount > 0 ? row.ratingSummary?.avgRating ?? 5 : 5;
    const foodAttrs = hasVariantChoice
      ? resolveFoodAttributeFlagsFromVariants(row.variants)
      : { supportsSpicy: false, supportsGreens: false };

    return {
      id: row.id,
      slug: translation?.slug || 'products',
      titleKey: 'home.figma.mobile.product.title',
      subtitleKey: 'home.figma.mobile.product.subtitle',
      title: translation?.title || `Product ${index + 1}`,
      category: categoryTranslation ? resolveShopCategoryTitle(locale, categoryTranslation) : '',
      categorySlug: categoryTranslation?.slug ?? '',
      image: resolveStorefrontProductImageFromMedia(row.media),
      price,
      oldPrice,
      discount: '',
      discountPercent: row.discountPercent,
      rating,
      inStock: isPublishedVariantInStock(variant),
      defaultVariantId: variant?.id ?? null,
      supportsSpicy: foodAttrs.supportsSpicy,
      supportsGreens: foodAttrs.supportsGreens,
    };
  });
}
