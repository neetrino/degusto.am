/** Figma Navigation node 45:1488 — DEGUSTO-DEV-1 */
const FIGMA_MENU_CATEGORIES = [
  {
    slug: "soups-hot-dishes",
    iconUrl: "https://www.figma.com/api/mcp/asset/f09e7270-8954-4d67-a25e-b64f1b0a6082",
    titles: {
      hy: "Ապուրներ եւ տաք ուտեստներ",
      en: "Soups & Hot Dishes",
      ru: "Супы и горячие блюда",
    },
  },
  {
    slug: "salads",
    iconUrl: "https://www.figma.com/api/mcp/asset/c1bce948-85fb-444f-b0e7-288d421e3f10",
    titles: {
      hy: "Աղցաններ",
      en: "Salads",
      ru: "Салаты",
    },
  },
  {
    slug: "shawarma",
    iconUrl: "https://www.figma.com/api/mcp/asset/84206f66-ffdb-498b-a1c4-cc97fab781af",
    localIconOnly: true,
    titles: { hy: "Շաուրմա", en: "Shawarma", ru: "Шаурма" },
  },
  {
    slug: "pizza",
    iconUrl: "https://www.figma.com/api/mcp/asset/0932654e-bcd5-417a-bf00-ff62c9fee960",
    titles: { hy: "Պիցցա", en: "Pizza", ru: "Пицца" },
  },
  {
    slug: "lahmajoun",
    iconUrl: "https://www.figma.com/api/mcp/asset/79ecf429-7a26-46b9-82a2-908529306ee7",
    localIconOnly: true,
    titles: { hy: "Լահմաջո", en: "Lahmajoun", ru: "Лахмаджун" },
  },
  {
    slug: "khachapuri",
    iconUrl: "https://www.figma.com/api/mcp/asset/4ff5a276-15a6-4ecd-bd4a-baa7e887edd7",
    titles: {
      hy: "Վրացական Խաչապուրի",
      en: "Georgian Khachapuri",
      ru: "Грузинский хачапури",
    },
  },
  {
    slug: "khorovats",
    iconUrl: "https://www.figma.com/api/mcp/asset/d037e2bc-d9d4-4bf6-b6ff-0aaf1356bfe8",
    titles: { hy: "Խորոված", en: "Khorovats", ru: "Хоровац" },
  },
  {
    slug: "khinkali",
    iconUrl: "https://www.figma.com/api/mcp/asset/577d7077-c4d5-4118-848a-24691f6db939",
    titles: { hy: "Խինկալի", en: "Khinkali", ru: "Хинкали" },
  },
  {
    slug: "stuffed-potato",
    iconUrl: "https://www.figma.com/api/mcp/asset/c39b7dd9-1514-4fd0-a44c-e89fba477937",
    titles: {
      hy: "Լցոնած կարտոֆիլ",
      en: "Stuffed Potato",
      ru: "Фаршированный картофель",
    },
  },
  {
    slug: "burgers-sandwiches",
    iconUrl: "https://www.figma.com/api/mcp/asset/e3237d18-5f7c-4247-b2e4-e044b9ce5ed1",
    titles: {
      hy: "Բուրգերներ եւ սենդվիչներ",
      en: "Burgers & Sandwiches",
      ru: "Бургеры и сэндвичи",
    },
  },
  {
    slug: "cakes-pancakes",
    iconUrl: "https://www.figma.com/api/mcp/asset/17ed2c01-6727-408c-8427-535009ae0915",
    titles: {
      hy: "Կարկանդակներ եւ նրբաբլիթներ",
      en: "Cakes & Pancakes",
      ru: "Торты и блины",
    },
  },
  {
    slug: "combo-packages",
    iconUrl: "https://www.figma.com/api/mcp/asset/05978f52-3610-4e60-aeb9-1c230bb7b9be",
    titles: {
      hy: "Կոմբո փաթեթներ",
      en: "Combo Packages",
      ru: "Комбо наборы",
    },
  },
  {
    slug: "lunch-boxes",
    iconUrl: "https://www.figma.com/api/mcp/asset/b8f4c9d3-383a-448d-8fa9-385c6152103e",
    titles: { hy: "Լանչ Բոքսեր", en: "Lunch Boxes", ru: "Ланч-боксы" },
  },
  {
    slug: "grill-smoked",
    iconUrl: "https://www.figma.com/api/mcp/asset/7ea67417-b96d-4aa5-935d-f4939cd03350",
    titles: {
      hy: "Գրիլ եւ ապխտած արտադրանքներ",
      en: "Grill & Smoked Products",
      ru: "Гриль и копчёные продукты",
    },
  },
  {
    slug: "bread",
    iconUrl: "https://www.figma.com/api/mcp/asset/5ba437aa-c6f2-46e1-81ec-8e2568129f6a",
    titles: { hy: "Հաց", en: "Bread", ru: "Хлеб" },
  },
  {
    slug: "pastry",
    iconUrl: "https://www.figma.com/api/mcp/asset/4511bea9-69f2-48dc-8f5f-1c80de08924a",
    titles: { hy: "Խմորեղեն", en: "Pastry", ru: "Выпечка" },
  },
  {
    slug: "fried-eggs",
    iconUrl: "https://www.figma.com/api/mcp/asset/af02c193-75d2-4c6d-9912-5880a3508553",
    titles: { hy: "Ձվածեղ", en: "Fried Eggs", ru: "Яичница" },
  },
  {
    slug: "lenten-dishes",
    iconUrl: "https://www.figma.com/api/mcp/asset/aae57705-3ef1-4cf7-a6ac-bc4717c9c4e2",
    titles: {
      hy: "Պահքի ուտեստներ",
      en: "Lenten Dishes",
      ru: "Постные блюда",
    },
  },
  {
    slug: "asian-sushi",
    iconUrl: "https://www.figma.com/api/mcp/asset/9d449d27-c062-482c-b1fb-2abbdc1c0fa2",
    titles: {
      hy: "Ասիական խոհանոց (Սուշի)",
      en: "Asian Cuisine (Sushi)",
      ru: "Азиатская кухня (Суши)",
    },
  },
  {
    slug: "pasta",
    iconUrl: "https://www.figma.com/api/mcp/asset/a6e00e22-8b0d-41fc-9629-5e7a3295b1fa",
    localIconOnly: true,
    titles: { hy: "Պաստաներ", en: "Pasta", ru: "Паста" },
  },
  {
    slug: "sauces",
    iconUrl: "https://www.figma.com/api/mcp/asset/e89a4c7b-27a2-4f22-b4fe-196532c2b0bd",
    titles: { hy: "Սոուսներ", en: "Sauces", ru: "Соусы" },
  },
  {
    slug: "restaurant",
    iconUrl: "https://www.figma.com/api/mcp/asset/9716521c-a7b9-43e5-80a2-3903057bf0d1",
    titles: { hy: "Ռեստորան", en: "Restaurant", ru: "Ресторан" },
  },
  {
    slug: "bar-alcohol",
    iconUrl: "https://www.figma.com/api/mcp/asset/08726c7e-5077-402b-a3b1-cd3c3baa9dbe",
    titles: {
      hy: "Բար (Ալկոհոլ)",
      en: "Bar (Alcohol)",
      ru: "Бар (Алкоголь)",
    },
  },
  {
    slug: "juices-drinks",
    iconUrl: "https://www.figma.com/api/mcp/asset/95ca9377-b608-4e46-9049-5a6c4b0060c0",
    titles: {
      hy: "Հյութեր և Ըմպելիքներ",
      en: "Juices & Drinks",
      ru: "Соки и напитки",
    },
  },
  {
    slug: "semi-finished",
    iconUrl: "https://www.figma.com/api/mcp/asset/83104d26-03c7-41c6-97f2-2e37140d7c3b",
    titles: {
      hy: "Կիսաֆաբրիկատներ",
      en: "Semi-finished Products",
      ru: "Полуфабрикаты",
    },
  },
  {
    slug: "mexican",
    iconUrl: "https://www.figma.com/api/mcp/asset/71dc79d8-7e73-4e75-9027-32b831323617",
    titles: {
      hy: "Մեքսիկական խոհանոց",
      en: "Mexican Cuisine",
      ru: "Мексиканская кухня",
    },
  },
];

const LEGACY_CATEGORY_SLUGS_TO_UNPUBLISH = [
  "burger",
  "kebab",
  "wraps",
  "plates",
  "snacks",
  "sandwiches",
  "combo",
];

const PRODUCTS_PER_CATEGORY = 20;

module.exports = {
  FIGMA_MENU_CATEGORIES,
  LEGACY_CATEGORY_SLUGS_TO_UNPUBLISH,
  PRODUCTS_PER_CATEGORY,
};
