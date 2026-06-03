/** Attribute definitions + category → attribute mapping for Degusto food catalog. */

const BASE_CUSTOMIZATION_KEYS = ["sauce", "garlic", "ingredient"];

const VARIANT_PREFERENCE_KEYS = ["spicy", "greens"];

const TOPPING_CATEGORY_SLUGS = new Set([
  "burgers-sandwiches",
  "pizza",
  "shawarma",
  "lahmajoun",
  "mexican",
  "combo-packages",
  "stuffed-potato",
  "khachapuri",
  "khorovats",
]);

/** Categories without spicy/greens variant dimensions. */
const NO_VARIANT_PREFERENCE_SLUGS = new Set([
  "juices-drinks",
  "bar-alcohol",
  "cakes-pancakes",
  "pastry",
  "bread",
  "sauces",
  "semi-finished",
]);

const FOOD_ATTRIBUTE_CONFIGS = [
  {
    key: "spicy",
    names: {
      en: "Spicy level",
      hy: "Կծվության մակարդակ",
      ru: "Уровень остроты",
    },
    values: [
      {
        value: "spicy",
        labels: { en: "Spicy", hy: "Կծու", ru: "Острое" },
      },
      {
        value: "not-spicy",
        labels: { en: "Not spicy", hy: "Առանց կծու", ru: "Не острое" },
      },
    ],
  },
  {
    key: "greens",
    names: {
      en: "Greens",
      hy: "Կանաչի",
      ru: "Зелень",
    },
    values: [
      {
        value: "with-greens",
        labels: { en: "With greens", hy: "Կանաչիով", ru: "С зеленью" },
      },
      {
        value: "without-greens",
        labels: { en: "Without greens", hy: "Առանց կանաչի", ru: "Без зелени" },
      },
    ],
  },
  {
    key: "sauce",
    names: {
      en: "Sauce",
      hy: "Սոուս",
      ru: "Соус",
    },
    values: [
      {
        value: "ketchup",
        labels: { en: "Ketchup", hy: "Կետչուպ", ru: "Кетчуп" },
      },
      {
        value: "mayonnaise",
        labels: { en: "Mayonnaise", hy: "Մայոնեզ", ru: "Майонез" },
      },
      {
        value: "barbecue",
        labels: { en: "Barbecue sauce", hy: "Բարբեկյու սոուս", ru: "Соус барбекю" },
      },
      {
        value: "garlic-sauce",
        labels: { en: "Garlic sauce", hy: "Սխտորային սոուս", ru: "Чесночный соус" },
      },
      {
        value: "no-sauce",
        labels: { en: "No sauce", hy: "Առանց սոուսի", ru: "Без соуса" },
      },
    ],
  },
  {
    key: "garlic",
    names: {
      en: "Garlic",
      hy: "Սխտոր",
      ru: "Чеснок",
    },
    values: [
      {
        value: "with-garlic",
        labels: { en: "With garlic", hy: "Սխտորով", ru: "С чесноком" },
      },
      {
        value: "without-garlic",
        labels: { en: "Without garlic", hy: "Առանց սխտորի", ru: "Без чеснока" },
      },
    ],
  },
  {
    key: "ingredient",
    names: {
      en: "Ingredients",
      hy: "Բաղադրիչներ",
      ru: "Ингредиенты",
    },
    values: [
      { value: "cheese", labels: { en: "Cheese", hy: "Պանիր", ru: "Сыр" } },
      { value: "bacon", labels: { en: "Bacon", hy: "Բեկոն", ru: "Бекон" } },
      { value: "egg", labels: { en: "Egg", hy: "Ձու", ru: "Яйцо" } },
      { value: "onion", labels: { en: "Onion", hy: "Սոխ", ru: "Лук" } },
      { value: "tomato", labels: { en: "Tomato", hy: "Տոմատ", ru: "Помидор" } },
      { value: "lettuce", labels: { en: "Lettuce", hy: "Մաղադանոս", ru: "Салат" } },
      { value: "pickles", labels: { en: "Pickles", hy: "Մարինացված վարունգ", ru: "Маринованные огурцы" } },
      { value: "mushroom", labels: { en: "Mushroom", hy: "Սունկ", ru: "Грибы" } },
      { value: "pepper", labels: { en: "Pepper", hy: "Պղպեղ", ru: "Перец" } },
      { value: "olives", labels: { en: "Olives", hy: "Ձիթապտղ", ru: "Оливки" } },
      { value: "jalapeno", labels: { en: "Jalapeño", hy: "Խաչեմոր", ru: "Халапеньо" } },
      { value: "corn", labels: { en: "Corn", hy: "Ցորեն", ru: "Кукуруза" } },
      { value: "cucumber", labels: { en: "Cucumber", hy: "Վարունգ", ru: "Огурец" } },
      { value: "avocado", labels: { en: "Avocado", hy: "Ավոկադո", ru: "Авокадо" } },
      { value: "ham", labels: { en: "Ham", hy: "Խոզի միս", ru: "Ветчина" } },
      { value: "chicken", labels: { en: "Chicken", hy: "Հավի միս", ru: "Курица" } },
      { value: "beef", labels: { en: "Beef", hy: "Տավարի միս", ru: "Говядина" } },
      { value: "potato", labels: { en: "Potato", hy: "Կարտոֆիլ", ru: "Картофель" } },
    ],
  },
  {
    key: "topping",
    names: {
      en: "Toppings",
      hy: "Լրացումներ",
      ru: "Топпинги",
    },
    values: [
      {
        value: "extra-cheese",
        labels: { en: "Extra cheese", hy: "Լրացուցիչ պանիր", ru: "Доп. сыр" },
      },
      {
        value: "mozzarella",
        labels: { en: "Mozzarella", hy: "Մոցարելլա", ru: "Моцарелла" },
      },
      {
        value: "parmesan",
        labels: { en: "Parmesan", hy: "Պարմեզան", ru: "Пармезан" },
      },
      {
        value: "bacon-bits",
        labels: { en: "Bacon bits", hy: "Բեկոնի կտորներ", ru: "Кусочки бекона" },
      },
      {
        value: "fried-onion",
        labels: { en: "Fried onion", hy: "Տապակած սոխ", ru: "Жареный лук" },
      },
      {
        value: "sesame",
        labels: { en: "Sesame", hy: "Քնձութ", ru: "Кунжут" },
      },
      {
        value: "herbs",
        labels: { en: "Fresh herbs", hy: "Թարմ կանաչիներ", ru: "Свежая зелень" },
      },
      {
        value: "chili-flakes",
        labels: { en: "Chili flakes", hy: "Չիլիի փշրանք", ru: "Хлопья чили" },
      },
      {
        value: "sun-dried-tomato",
        labels: { en: "Sun-dried tomato", hy: "Արևի չոր տոմատ", ru: "Вяленые томаты" },
      },
      {
        value: "pesto",
        labels: { en: "Pesto", hy: "Պեստո", ru: "Песто" },
      },
    ],
  },
];

/**
 * Attribute keys linked to a product for the given category slug.
 * @param {string | null | undefined} categorySlug
 * @returns {string[]}
 */
function getAttributeKeysForCategorySlug(categorySlug) {
  const keys = [...BASE_CUSTOMIZATION_KEYS];

  if (categorySlug && !NO_VARIANT_PREFERENCE_SLUGS.has(categorySlug)) {
    keys.unshift(...VARIANT_PREFERENCE_KEYS);
  }

  if (categorySlug && TOPPING_CATEGORY_SLUGS.has(categorySlug)) {
    keys.push("topping");
  }

  return [...new Set(keys)];
}

module.exports = {
  FOOD_ATTRIBUTE_CONFIGS,
  BASE_CUSTOMIZATION_KEYS,
  VARIANT_PREFERENCE_KEYS,
  getAttributeKeysForCategorySlug,
};
