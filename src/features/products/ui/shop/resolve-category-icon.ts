const CATEGORY_ICON_DIR = "/shop/category-icons";

const CATEGORY_ICON_FILES = new Set([
  "all",
  "asian-sushi",
  "bar-alcohol",
  "bread",
  "burgers-sandwiches",
  "cakes-pancakes",
  "combo-packages",
  "fried-eggs",
  "grill-smoked",
  "juices-drinks",
  "khachapuri",
  "khinkali",
  "khorovats",
  "lahmajoun",
  "lenten-dishes",
  "lunch-boxes",
  "mexican",
  "pasta",
  "pastry",
  "pizza",
  "restaurant",
  "salads",
  "sauces",
  "semi-finished",
  "shawarma",
  "soups-hot-dishes",
  "stuffed-potato",
]);

/** Local DB slug aliases → reference icon filenames. */
const CATEGORY_ICON_ALIASES: Record<string, string> = {
  combo: "combo-packages",
  apurner: "soups-hot-dishes",
  soups: "soups-hot-dishes",
  aghaner: "salads",
  salad: "salads",
  salads: "salads",
};

const TITLE_ICON_RULES: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /pizza|պիցցա|пицц/i, icon: "pizza" },
  { pattern: /shawarma|շաուրմա|шаурм/i, icon: "shawarma" },
  { pattern: /soup|ապուր|суп|տաք ուտեստ/i, icon: "soups-hot-dishes" },
  { pattern: /salad|աղցան|салат/i, icon: "salads" },
  { pattern: /lahmaj|լահմաջ|лахмадж/i, icon: "lahmajoun" },
  { pattern: /khachapur|խաչապուր|хачапур/i, icon: "khachapuri" },
  { pattern: /khorovat|խորոված|мангал|барбекю/i, icon: "khorovats" },
  { pattern: /khinkal|խինկալ|хинкал/i, icon: "khinkali" },
  { pattern: /potato|կարտոֆիլ|картоф/i, icon: "stuffed-potato" },
  { pattern: /burger|սենդվիչ|бургер|сэндвич/i, icon: "burgers-sandwiches" },
  { pattern: /pancake|կարկանդակ|նրբաբլիթ|блин/i, icon: "cakes-pancakes" },
  { pattern: /combo|կոմբո|комбо/i, icon: "combo-packages" },
  { pattern: /lunch|լանչ|ланч/i, icon: "lunch-boxes" },
  { pattern: /grill|գրիլ|ապխտած|гриль/i, icon: "grill-smoked" },
  { pattern: /bread|հաց|хлеб/i, icon: "bread" },
  { pattern: /pastry|խմորեղեն|выпечк/i, icon: "pastry" },
  { pattern: /egg|ձվածեղ|яичн/i, icon: "fried-eggs" },
  { pattern: /lent|պահք|постн/i, icon: "lenten-dishes" },
  { pattern: /sushi|ասիական|суши/i, icon: "asian-sushi" },
  { pattern: /pasta|պաստա|паст/i, icon: "pasta" },
  { pattern: /sauce|սոուս|соус/i, icon: "sauces" },
  { pattern: /restaurant|ռեստորան|ресторан/i, icon: "restaurant" },
  { pattern: /bar|ալկոհոլ|алкогол/i, icon: "bar-alcohol" },
  { pattern: /juice|հյութ|ըմպելիք|сок|напит/i, icon: "juices-drinks" },
  { pattern: /semi|կիսաֆաբրիկ|полуфабр/i, icon: "semi-finished" },
  { pattern: /mexican|մեքսիկ|мексик/i, icon: "mexican" },
];

/** Figma sidebar icon geometry: outer box vs exported leaf SVG. */
export type CategoryIconAsset = {
  src: string;
  boxWidth: number;
  boxHeight: number;
  leafWidth: number;
  leafHeight: number;
  rotateDeg?: number;
};

type IconLayout = Omit<CategoryIconAsset, "src">;

const DEFAULT_LAYOUT: IconLayout = {
  boxWidth: 24,
  boxHeight: 24,
  leafWidth: 24,
  leafHeight: 24,
};

const ICON_LAYOUTS: Record<string, IconLayout> = {
  salads: { boxWidth: 24, boxHeight: 24, leafWidth: 20.53, leafHeight: 19.68 },
  shawarma: { boxWidth: 25, boxHeight: 25, leafWidth: 22, leafHeight: 23 },
  lahmajoun: {
    boxWidth: 29.88,
    boxHeight: 29.86,
    leafWidth: 29.88,
    leafHeight: 29.86,
  },
  khachapuri: {
    boxWidth: 28.31,
    boxHeight: 33.52,
    leafWidth: 30.77,
    leafHeight: 19.5,
    rotateDeg: -64.08,
  },
  khorovats: { boxWidth: 24, boxHeight: 24, leafWidth: 22.54, leafHeight: 22.54 },
  khinkali: { boxWidth: 25, boxHeight: 22, leafWidth: 25.5, leafHeight: 22.5 },
  "stuffed-potato": {
    boxWidth: 24,
    boxHeight: 24,
    leafWidth: 22.5,
    leafHeight: 24,
  },
  "cakes-pancakes": {
    boxWidth: 28,
    boxHeight: 29,
    leafWidth: 28,
    leafHeight: 29,
  },
  bread: { boxWidth: 24, boxHeight: 24, leafWidth: 20.43, leafHeight: 20.43 },
  pastry: { boxWidth: 23, boxHeight: 23, leafWidth: 23, leafHeight: 23 },
  "lenten-dishes": {
    boxWidth: 20,
    boxHeight: 20,
    leafWidth: 20,
    leafHeight: 20,
  },
  pasta: { boxWidth: 19.39, boxHeight: 19.72, leafWidth: 19.39, leafHeight: 19.72 },
  sauces: { boxWidth: 22, boxHeight: 22, leafWidth: 22, leafHeight: 22 },
  restaurant: { boxWidth: 22, boxHeight: 22, leafWidth: 22, leafHeight: 22 },
  "bar-alcohol": { boxWidth: 22, boxHeight: 23, leafWidth: 22, leafHeight: 23 },
  "juices-drinks": { boxWidth: 19, boxHeight: 19, leafWidth: 19, leafHeight: 19 },
  "semi-finished": { boxWidth: 24, boxHeight: 24, leafWidth: 21, leafHeight: 21 },
  mexican: { boxWidth: 25, boxHeight: 25, leafWidth: 25, leafHeight: 25 },
};

function iconFileName(slug: string, title: string): string {
  const normalized = slug.trim().toLowerCase();
  if (CATEGORY_ICON_FILES.has(normalized)) {
    return normalized;
  }

  const alias = CATEGORY_ICON_ALIASES[normalized];
  if (alias && CATEGORY_ICON_FILES.has(alias)) {
    return alias;
  }

  const haystack = `${normalized} ${title}`;
  for (const rule of TITLE_ICON_RULES) {
    if (rule.pattern.test(haystack) && CATEGORY_ICON_FILES.has(rule.icon)) {
      return rule.icon;
    }
  }

  return "all";
}

function toAsset(fileName: string): CategoryIconAsset {
  const layout = ICON_LAYOUTS[fileName] ?? DEFAULT_LAYOUT;
  return {
    src: `${CATEGORY_ICON_DIR}/${fileName}.svg`,
    ...layout,
  };
}

/**
 * Resolves a local category slug/title to the Figma sidebar icon asset.
 */
export function resolveCategoryIcon(
  slug: string,
  title = "",
): CategoryIconAsset {
  return toAsset(iconFileName(slug, title));
}
