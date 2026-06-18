import type { MenuCard } from '@/components/home/menu-types';

type TranslateFn = (_key: string) => string;

const STOREFRONT_CATEGORY_TRANSLATION_KEY_BY_SLUG: Record<string, string> = {
  'soups-hot-dishes': 'home.figma.desktop.categories.soupsAndHotDishes',
  salads: 'home.figma.desktop.categories.salads',
  shawarma: 'home.figma.desktop.categories.shawarma',
  pizza: 'home.figma.desktop.categories.pizza',
  lahmajoun: 'home.figma.desktop.categories.lahmajo',
  lahmajo: 'home.figma.desktop.categories.lahmajo',
  khachapuri: 'home.figma.desktop.categories.georgianKhachapuri',
  khorovats: 'home.figma.desktop.categories.bbq',
  khinkali: 'home.figma.desktop.categories.khinkali',
  'stuffed-potato': 'home.figma.desktop.categories.stuffedPotato',
  'burgers-sandwiches': 'home.figma.desktop.categories.burgersAndSandwiches',
  'cakes-pancakes': 'home.figma.desktop.categories.piesAndPancakes',
  'combo-packages': 'home.figma.desktop.categories.comboSets',
  'lunch-boxes': 'home.figma.desktop.categories.lunchBoxes',
  'grill-smoked': 'home.figma.desktop.categories.grillAndSmokedProducts',
  bread: 'home.figma.desktop.categories.bread',
  pastry: 'home.figma.desktop.categories.pastry',
  'fried-eggs': 'home.figma.desktop.categories.friedEggs',
  'lenten-dishes': 'home.figma.desktop.categories.lentenDishes',
  'asian-sushi': 'home.figma.desktop.categories.asianSushi',
  pasta: 'home.figma.desktop.categories.pasta',
  sauces: 'home.figma.desktop.categories.sauces',
  restaurant: 'home.figma.desktop.categories.restaurant',
  'bar-alcohol': 'home.figma.desktop.categories.barAlcohol',
  'juices-drinks': 'home.figma.desktop.categories.juicesDrinks',
  'semi-finished': 'home.figma.desktop.categories.semiFinished',
  mexican: 'home.figma.desktop.categories.mexican',
};

const STOREFRONT_CATEGORY_TRANSLATION_KEY_BY_TITLE: Record<string, string> = {
  'soups and hot dishes': 'home.figma.desktop.categories.soupsAndHotDishes',
  'супы и горячие блюда': 'home.figma.desktop.categories.soupsAndHotDishes',
  'ապուրներ եւ տաք ուտեստներ': 'home.figma.desktop.categories.soupsAndHotDishes',
  'ապուրներ և տաք ուտեստներ': 'home.figma.desktop.categories.soupsAndHotDishes',
  salads: 'home.figma.desktop.categories.salads',
  'салаты': 'home.figma.desktop.categories.salads',
  'աղցաններ': 'home.figma.desktop.categories.salads',
  shawarma: 'home.figma.desktop.categories.shawarma',
  'шаурма': 'home.figma.desktop.categories.shawarma',
  'շաուրմա': 'home.figma.desktop.categories.shawarma',
  pizza: 'home.figma.desktop.categories.pizza',
  'пицца': 'home.figma.desktop.categories.pizza',
  'պիցցա': 'home.figma.desktop.categories.pizza',
  lahmajo: 'home.figma.desktop.categories.lahmajo',
  'лахмаджо': 'home.figma.desktop.categories.lahmajo',
  'լահմաջո': 'home.figma.desktop.categories.lahmajo',
  'georgian khachapuri': 'home.figma.desktop.categories.georgianKhachapuri',
  'грузинский хачапури': 'home.figma.desktop.categories.georgianKhachapuri',
  'վրացական խաչապուրի': 'home.figma.desktop.categories.georgianKhachapuri',
  bbq: 'home.figma.desktop.categories.bbq',
  'шашлык': 'home.figma.desktop.categories.bbq',
  'խորոված': 'home.figma.desktop.categories.bbq',
  khinkali: 'home.figma.desktop.categories.khinkali',
  'хинкали': 'home.figma.desktop.categories.khinkali',
  'խինկալի': 'home.figma.desktop.categories.khinkali',
  'stuffed potato': 'home.figma.desktop.categories.stuffedPotato',
  'фаршированный картофель': 'home.figma.desktop.categories.stuffedPotato',
  'լցոնած կարտոֆիլ': 'home.figma.desktop.categories.stuffedPotato',
  'burgers and sandwiches': 'home.figma.desktop.categories.burgersAndSandwiches',
  'бургеры и сэндвичи': 'home.figma.desktop.categories.burgersAndSandwiches',
  'բուրգերներ եւ սենդվիչներ': 'home.figma.desktop.categories.burgersAndSandwiches',
  'բուրգերներ և սենդվիչներ': 'home.figma.desktop.categories.burgersAndSandwiches',
  'pies and pancakes': 'home.figma.desktop.categories.piesAndPancakes',
  'пироги и блины': 'home.figma.desktop.categories.piesAndPancakes',
  'կարկանդակներ եւ նրբաբլիթներ': 'home.figma.desktop.categories.piesAndPancakes',
  'կարկանդակներ և նրբաբլիթներ': 'home.figma.desktop.categories.piesAndPancakes',
  'combo sets': 'home.figma.desktop.categories.comboSets',
  'комбо-наборы': 'home.figma.desktop.categories.comboSets',
  'կոմբո փաթեթներ': 'home.figma.desktop.categories.comboSets',
  'lunch boxes': 'home.figma.desktop.categories.lunchBoxes',
  'ланч-боксы': 'home.figma.desktop.categories.lunchBoxes',
  'լանչ բոքսեր': 'home.figma.desktop.categories.lunchBoxes',
  'grill and smoked products': 'home.figma.desktop.categories.grillAndSmokedProducts',
  'гриль и копченые продукты': 'home.figma.desktop.categories.grillAndSmokedProducts',
  'գրիլ եւ ապխտած արտադրանքներ': 'home.figma.desktop.categories.grillAndSmokedProducts',
  'գրիլ և ապխտած արտադրանքներ': 'home.figma.desktop.categories.grillAndSmokedProducts',
  bread: 'home.figma.desktop.categories.bread',
  'хлеб': 'home.figma.desktop.categories.bread',
  'հաց': 'home.figma.desktop.categories.bread',
  pastry: 'home.figma.desktop.categories.pastry',
  'выпечка': 'home.figma.desktop.categories.pastry',
  'խմորեղեն': 'home.figma.desktop.categories.pastry',
  'fried eggs': 'home.figma.desktop.categories.friedEggs',
  'яичница': 'home.figma.desktop.categories.friedEggs',
  'ձվածեղ': 'home.figma.desktop.categories.friedEggs',
  'lenten dishes': 'home.figma.desktop.categories.lentenDishes',
  'постные блюда': 'home.figma.desktop.categories.lentenDishes',
  'պահքի ուտեստներ': 'home.figma.desktop.categories.lentenDishes',
  'asian cuisine (sushi)': 'home.figma.desktop.categories.asianSushi',
  'азиатская кухня (суши)': 'home.figma.desktop.categories.asianSushi',
  'ասիական խոհանոց (սուշի)': 'home.figma.desktop.categories.asianSushi',
  pasta: 'home.figma.desktop.categories.pasta',
  'паста': 'home.figma.desktop.categories.pasta',
  'պաստաներ': 'home.figma.desktop.categories.pasta',
  sauces: 'home.figma.desktop.categories.sauces',
  'соусы': 'home.figma.desktop.categories.sauces',
  'սոուսներ': 'home.figma.desktop.categories.sauces',
  restaurant: 'home.figma.desktop.categories.restaurant',
  'ресторан': 'home.figma.desktop.categories.restaurant',
  'ռեստորան': 'home.figma.desktop.categories.restaurant',
  'bar (alcohol)': 'home.figma.desktop.categories.barAlcohol',
  'бар (алкоголь)': 'home.figma.desktop.categories.barAlcohol',
  'բար (ալկոհոլ)': 'home.figma.desktop.categories.barAlcohol',
  'juices and drinks': 'home.figma.desktop.categories.juicesDrinks',
  'соки и напитки': 'home.figma.desktop.categories.juicesDrinks',
  'հյութեր և ըմպելիքներ': 'home.figma.desktop.categories.juicesDrinks',
  'հյութեր եւ ըմպելիքներ': 'home.figma.desktop.categories.juicesDrinks',
  'semi-finished products': 'home.figma.desktop.categories.semiFinished',
  'полуфабрикаты': 'home.figma.desktop.categories.semiFinished',
  'կիսաֆաբրիկատներ': 'home.figma.desktop.categories.semiFinished',
  'mexican cuisine': 'home.figma.desktop.categories.mexican',
  'мексиканская кухня': 'home.figma.desktop.categories.mexican',
  'մեքսիկական խոհանոց': 'home.figma.desktop.categories.mexican',
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

type StorefrontCategoryLabelInput = {
  slug?: string | null;
  title?: string | null;
};

export function resolveStorefrontCategoryLabel(
  category: StorefrontCategoryLabelInput,
  t: TranslateFn
): string {
  const normalizedSlug = category.slug ? normalizeKey(category.slug) : '';
  if (!normalizedSlug) {
    return t('home.figma.desktop.categories.all');
  }

  const categoryTranslationKey = STOREFRONT_CATEGORY_TRANSLATION_KEY_BY_SLUG[normalizedSlug];
  if (categoryTranslationKey) {
    return t(categoryTranslationKey);
  }

  const normalizedTitle = category.title ? normalizeKey(category.title) : '';
  if (normalizedTitle) {
    const titleTranslationKey = STOREFRONT_CATEGORY_TRANSLATION_KEY_BY_TITLE[normalizedTitle];
    if (titleTranslationKey) {
      return t(titleTranslationKey);
    }
  }

  return category.title ?? '';
}

/**
 * Resolves product card category label through locale dictionaries when possible.
 */
export function resolveMenuCardCategoryLabel(card: MenuCard, t: TranslateFn): string {
  if (card.categoryKey) {
    return t(card.categoryKey);
  }
  return resolveStorefrontCategoryLabel(
    {
      slug: card.categorySlug,
      title: card.category,
    },
    t
  );
}
