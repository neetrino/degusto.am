import { staticAssetUrl } from "@/lib/media/static-asset-url";
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

/**
 * Resolves a local category slug/title to a shop sidebar icon asset path.
 */
export function resolveCategoryIconSrc(slug: string, title = ""): string {
  const normalized = slug.trim().toLowerCase();
  if (CATEGORY_ICON_FILES.has(normalized)) {
    return staticAssetUrl(`/assets/categories/icons/${normalized}.webp`);
  }

  const alias = CATEGORY_ICON_ALIASES[normalized];
  if (alias && CATEGORY_ICON_FILES.has(alias)) {
    return staticAssetUrl(`/assets/categories/icons/${alias}.webp`);
  }

  const haystack = `${normalized} ${title}`;
  for (const rule of TITLE_ICON_RULES) {
    if (rule.pattern.test(haystack) && CATEGORY_ICON_FILES.has(rule.icon)) {
      return staticAssetUrl(`/assets/categories/icons/${rule.icon}.webp`);
    }
  }

  return staticAssetUrl("/assets/categories/icons/all.webp");
}
