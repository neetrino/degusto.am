import type { TranslationsJson } from "@/db/schema";
import { seedIds } from "@/db/seed/ids";

/** Menu categories mirrored from Neon (`catalog-from-db.json`). */
export const seedMenuCategories: ReadonlyArray<{
  id: string;
  sortOrder: number;
  status: "ACTIVE" | "ARCHIVED";
  translations: TranslationsJson;
  mediaId: string;
  objectKey: string;
}> = [
  {
    id: seedIds.categorySoups,
    sortOrder: 1,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategorySoups,
    objectKey: "assets/categories/soup.webp",
    translations: {
      hy: {
        slug: "apurner",
        title: "Ապուրներ եւ տաք ուտեստներ",
        description: "Ապուրներ և տաք ուտեստներ",
      },
      en: {
        slug: "soups",
        title: "Soups & hot dishes",
        description: "Soups and hot dishes",
      },
      ru: {
        slug: "supy",
        title: "Супы и горячие блюда",
        description: "Супы и горячие блюда",
      },
    },
  },
  {
    id: seedIds.categorySalads,
    sortOrder: 2,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategorySalads,
    objectKey: "assets/categories/salad.webp",
    translations: {
      hy: {
        slug: "aghaner",
        title: "Աղցաններ",
        description: "Թարմ աղցաններ",
      },
      en: {
        slug: "salads",
        title: "Salads",
        description: "Fresh salads",
      },
      ru: {
        slug: "salaty",
        title: "Салаты",
        description: "Свежие салаты",
      },
    },
  },
  {
    id: seedIds.categoryShawarma,
    sortOrder: 3,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategoryShawarma,
    objectKey: "assets/categories/shawarma.webp",
    translations: {
      hy: { slug: "shawarma", title: "Շաուրմա", description: "Շաուրմա" },
      en: { slug: "shawarma", title: "Shawarma", description: "Shawarma" },
      ru: { slug: "shaurma", title: "Шаурма", description: "Шаурма" },
    },
  },
  {
    id: seedIds.categoryPizza,
    sortOrder: 4,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategoryPizza,
    objectKey: "assets/categories/pizza.webp",
    translations: {
      hy: { slug: "pizza", title: "Պիցցա", description: "Պիցցա" },
      en: { slug: "pizza", title: "Pizza", description: "Pizza" },
      ru: { slug: "pitstsa", title: "Пицца", description: "Пицца" },
    },
  },
  {
    id: seedIds.categoryLahmajoun,
    sortOrder: 5,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategoryLahmajoun,
    objectKey: "assets/categories/lahmajoun.webp",
    translations: {
      hy: { slug: "lahmajoun", title: "Լահմաջո", description: "Լահմաջո" },
      en: { slug: "lahmajoun", title: "Lahmajoun", description: "Lahmajoun" },
      ru: {
        slug: "lakhmadzhun",
        title: "Лахмаджун",
        description: "Лахмаджун",
      },
    },
  },
  {
    id: seedIds.categoryKhachapuri,
    sortOrder: 6,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategoryKhachapuri,
    objectKey: "assets/categories/khachapuri.webp",
    translations: {
      hy: {
        slug: "khachapuri",
        title: "Վրացական Խաչապուրի",
        description: "Վրացական խաչապուրի",
      },
      en: {
        slug: "khachapuri",
        title: "Georgian Khachapuri",
        description: "Georgian khachapuri",
      },
      ru: {
        slug: "khachapuri",
        title: "Грузинский хачапури",
        description: "Грузинский хачапури",
      },
    },
  },
  {
    id: seedIds.categoryKhorovats,
    sortOrder: 7,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategoryKhorovats,
    objectKey: "assets/categories/khorovats.webp",
    translations: {
      hy: { slug: "khorovats", title: "Խորոված", description: "Խորոված" },
      en: { slug: "khorovats", title: "Barbecue", description: "Barbecue" },
      ru: { slug: "khorovats", title: "Шашлык", description: "Шашлык" },
    },
  },
  {
    id: seedIds.categoryCombo,
    sortOrder: 8,
    status: "ACTIVE",
    mediaId: seedIds.mediaCategoryCombo,
    objectKey: "assets/categories/combo.webp",
    translations: {
      hy: {
        slug: "combo",
        title: "Կոմբոներ",
        description: "Կոմբո առաջարկներ",
      },
      en: { slug: "combos", title: "Combos", description: "Combo deals" },
      ru: { slug: "kombo", title: "Комбо", description: "Комбо-наборы" },
    },
  },
  {
    id: seedIds.categoryBurgers,
    sortOrder: 99,
    status: "ARCHIVED",
    mediaId: seedIds.mediaCategoryBurgers,
    objectKey: "assets/categories/pizza.webp",
    translations: {
      hy: {
        slug: "burger",
        title: "Բուրգեր",
        description: "Համեղ բուրգերներ",
      },
      en: {
        slug: "burgers",
        title: "Burgers",
        description: "Signature Degusto burgers",
      },
      ru: {
        slug: "burgery",
        title: "Бургеры",
        description: "Фирменные бургеры Degusto",
      },
    },
  },
];
