type CategoryTranslationRow = {
  locale: string;
  title: string;
  slug: string;
};

const HY_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  'soups-hot-dishes': 'Ապուրներ եւ տաք ուտեստներ',
  salads: 'Աղցաններ',
  shawarma: 'Շաուրմա',
  pizza: 'Պիցցա',
  lahmajoun: 'Լահմաջո',
  khachapuri: 'Վրացական Խաչապուրի',
  khorovats: 'Խորոված',
  khinkali: 'Խինկալի',
  'stuffed-potato': 'Լցոնած կարտոֆիլ',
  'burgers-sandwiches': 'Բուրգերներ եւ սենդվիչներ',
  'cakes-pancakes': 'Կարկանդակներ եւ նրբաբլիթներ',
  'combo-packages': 'Կոմբո փաթեթներ',
  'lunch-boxes': 'Լանչ Բոքսեր',
  'grill-smoked': 'Գրիլ եւ ապխտած արտադրանքներ',
  bread: 'Հաց',
  pastry: 'Խմորեղեն',
  'fried-eggs': 'Ձվածեղ',
  'lenten-dishes': 'Պահքի ուտեստներ',
  'asian-sushi': 'Ասիական խոհանոց (Սուշի)',
  pasta: 'Պաստաներ',
  sauces: 'Սոուսներ',
  restaurant: 'Ռեստորան',
  'bar-alcohol': 'Բար (Ալկոհոլ)',
  'juices-drinks': 'Հյութեր և Ըմպելիքներ',
  'semi-finished': 'Կիսաֆաբրիկատներ',
  mexican: 'Մեքսիկական խոհանոց',
};

const EN_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  'soups-hot-dishes': 'Soups and hot dishes',
  salads: 'Salads',
  shawarma: 'Shawarma',
  pizza: 'Pizza',
  lahmajoun: 'Lahmajo',
  khachapuri: 'Georgian Khachapuri',
  khorovats: 'BBQ',
  khinkali: 'Khinkali',
  'stuffed-potato': 'Stuffed potato',
  'burgers-sandwiches': 'Burgers and sandwiches',
  'cakes-pancakes': 'Pies and pancakes',
  'combo-packages': 'Combo sets',
  'lunch-boxes': 'Lunch boxes',
  'grill-smoked': 'Grill and smoked products',
  bread: 'Bread',
  pastry: 'Pastry',
  'fried-eggs': 'Fried eggs',
  'lenten-dishes': 'Lenten dishes',
  'asian-sushi': 'Asian cuisine (Sushi)',
  pasta: 'Pastas',
  sauces: 'Sauces',
  restaurant: 'Restaurant',
  'bar-alcohol': 'Bar (Alcohol)',
  'juices-drinks': 'Juices and drinks',
  'semi-finished': 'Semi-finished products',
  mexican: 'Mexican cuisine',
};

const RU_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  'soups-hot-dishes': 'Супы и горячие блюда',
  salads: 'Салаты',
  shawarma: 'Шаурма',
  pizza: 'Пицца',
  lahmajoun: 'Лахмаджо',
  khachapuri: 'Грузинский хачапури',
  khorovats: 'Шашлык',
  khinkali: 'Хинкали',
  'stuffed-potato': 'Фаршированный картофель',
  'burgers-sandwiches': 'Бургеры и сэндвичи',
  'cakes-pancakes': 'Пироги и блины',
  'combo-packages': 'Комбо-наборы',
  'lunch-boxes': 'Ланч-боксы',
  'grill-smoked': 'Гриль и копченые продукты',
  bread: 'Хлеб',
  pastry: 'Выпечка',
  'fried-eggs': 'Яичница',
  'lenten-dishes': 'Постные блюда',
  'asian-sushi': 'Азиатская кухня (Суши)',
  pasta: 'Паста',
  sauces: 'Соусы',
  restaurant: 'Ресторан',
  'bar-alcohol': 'Бар (Алкоголь)',
  'juices-drinks': 'Соки и напитки',
  'semi-finished': 'Полуфабрикаты',
  mexican: 'Мексиканская кухня',
};

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
