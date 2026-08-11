import { staticAssetUrl } from "@/lib/media/static-asset-url";

/**
 * Transparent food cutouts under `/assets/categories/icons`
 * (files present in public + R2).
 */
const CATEGORY_ICON_FILES = new Set([
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
  "sauces",
  "salads",
  "semi-finished",
  "shawarma",
  "soups-hot-dishes",
  "stuffed-potato",
]);

/**
 * Slug aliases (hy + en + legacy) → cutout filename stem.
 * Degusto production categories use Armenian slugs.
 */
const CATEGORY_ICON_ALIASES: Record<string, string> = {
  // Latin / seed
  sushi: "asian-sushi",
  "asian-sushi": "asian-sushi",
  "asian-cuisine-sushi": "asian-sushi",
  bar: "bar-alcohol",
  alcohol: "bar-alcohol",
  omelette: "fried-eggs",
  "fried-eggs": "fried-eggs",
  eggs: "fried-eggs",
  "omelette-legacy-17": "fried-eggs",
  drinks: "juices-drinks",
  juices: "juices-drinks",
  burgers: "burgers-sandwiches",
  sandwiches: "burgers-sandwiches",
  "burgers-sandwiches": "burgers-sandwiches",
  "burgers-and-sandwiches": "burgers-sandwiches",
  "pies-crepes": "cakes-pancakes",
  "cakes-pancakes": "cakes-pancakes",
  pancakes: "cakes-pancakes",
  "pies-and-pancakes": "cakes-pancakes",
  grill: "grill-smoked",
  "grill-smoked": "grill-smoked",
  "grilled-and-smoked-products": "grill-smoked",
  lenten: "lenten-dishes",
  "lenten-dishes": "lenten-dishes",
  "fasting-dishes": "lenten-dishes",
  "lunch-boxes": "lunch-boxes",
  lunch: "lunch-boxes",
  "lunch-boxes-legacy-13": "lunch-boxes",
  "stuffed-potato": "stuffed-potato",
  "stuffed-potatoes": "stuffed-potato",
  potato: "stuffed-potato",
  khinkali: "khinkali",
  "khinkali-legacy-8": "khinkali",
  khorovats: "khorovats",
  grilled: "khorovats",
  barbecue: "khorovats",
  bread: "bread",
  "bread-legacy-15": "bread",
  bakery: "pastry",
  pastry: "pastry",
  pasta: "pasta",
  pastas: "pasta",
  sauces: "sauces",
  mexican: "mexican",
  restaurant: "restaurant",
  soups: "soups-hot-dishes",
  "soups-hot-dishes": "soups-hot-dishes",
  "soups-and-hot-dishes": "soups-hot-dishes",
  apurner: "soups-hot-dishes",
  salads: "salads",
  salad: "salads",
  aghaner: "salads",
  "salads-legacy-2": "salads",
  shawarma: "shawarma",
  "shawarma-legacy-3": "shawarma",
  pizza: "pizza",
  "pizza-legacy-4": "pizza",
  khachapuri: "khachapuri",
  "georgian-khachapuri": "khachapuri",
  lahmajoun: "lahmajoun",
  lahmajo: "lahmajoun",
  lahmacun: "lahmajoun",
  "semi-finished": "semi-finished",
  kisafabrikatner: "semi-finished",
  polufabrikaty: "semi-finished",
  semifinished: "semi-finished",
  "combo-packages": "combo-packages",
  "combo-packs": "combo-packages",
  combo: "combo-packages",
  combos: "combo-packages",
  "kombo-paketner": "combo-packages",
  "kombo-pakety": "combo-packages",

  // Armenian production slugs
  "ապուրներ-եւ-տաք-ուտեստներ": "soups-hot-dishes",
  աղցաններ: "salads",
  շաուրմա: "shawarma",
  պիցցա: "pizza",
  "վրացական-խաչապուրի": "khachapuri",
  խաչապուրի: "khachapuri",
  լահմաջո: "lahmajoun",
  խինկալի: "khinkali",
  խորոված: "khorovats",
  "լցոնած-կարտոֆիլ": "stuffed-potato",
  "բուրգերներ-եւ-սենդվիչներ": "burgers-sandwiches",
  "կարկանդակներ-եւ-նրբաբլիթներ": "cakes-pancakes",
  "լանչ-բոքսեր": "lunch-boxes",
  "գրիլ-եւ-ապխտած-արտադրանքներ": "grill-smoked",
  հաց: "bread",
  խմորեղեն: "pastry",
  ձվածեղ: "fried-eggs",
  "պահքի-ուտեստներ": "lenten-dishes",
  "ասիական-խոհանոց-սուշի": "asian-sushi",
  պաստաներ: "pasta",
  սոուսեր: "sauces",
  բար: "bar-alcohol",
  ռեստորան: "restaurant",
  մեքսիկական: "mexican",
  "հյութեր-եւ-ըմպելիքներ": "juices-drinks",
  կիսաֆաբրիկատներ: "semi-finished",
  "կոմբո-փաթեթներ": "combo-packages",
  կոմբո: "combo-packages",
};

const TITLE_ICON_RULES: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /soup|ապուր|տաք ուտեստ|суп|горяч/, icon: "soups-hot-dishes" },
  { pattern: /salad|աղցան|салат/, icon: "salads" },
  { pattern: /shawarma|շաուրմա|шаурм/, icon: "shawarma" },
  { pattern: /pizza|պիցցա|пицц/, icon: "pizza" },
  { pattern: /khachapur|խաչապուր|хачапур/, icon: "khachapuri" },
  { pattern: /lahmaj|լահմաջ|лахмадж/, icon: "lahmajoun" },
  { pattern: /khinkal|խինկալ|хинкал/, icon: "khinkali" },
  { pattern: /stuffed.?potato|լցոնած.?կարտոֆիլ|картоф/, icon: "stuffed-potato" },
  {
    pattern: /burger|սենդվիչ|բուրգեր|бургер|сэндвич/,
    icon: "burgers-sandwiches",
  },
  {
    pattern: /pancake|կարկանդակ|նրբաբլիթ|տորթ|пирож|блин|торт|pies?/,
    icon: "cakes-pancakes",
  },
  { pattern: /lunch|լանչ|ланч|բոքս/, icon: "lunch-boxes" },
  {
    pattern: /ապխտած|smoked|копчен|գրիլ.?եւ|grill.?and.?smoked/,
    icon: "grill-smoked",
  },
  {
    pattern: /khorovat|խորոված|мангал|барбекю|շաշլիք|barbecue/,
    icon: "khorovats",
  },
  { pattern: /bread|հաց|хлеб/, icon: "bread" },
  { pattern: /pastry|խմորեղեն|выпечк|bakery/, icon: "pastry" },
  { pattern: /egg|ձվածեղ|яичн|омлет|omelette/, icon: "fried-eggs" },
  { pattern: /lent|պահք|постн|fasting/, icon: "lenten-dishes" },
  { pattern: /sushi|ասիական|суши/, icon: "asian-sushi" },
  { pattern: /pasta|պաստա|паст/, icon: "pasta" },
  { pattern: /sauce|սոուս|соус/, icon: "sauces" },
  { pattern: /restaurant|ռեստորան|ресторан/, icon: "restaurant" },
  { pattern: /(?:^|[\s-])bar(?:$|[\s-])|ալկոհոլ|алкогол|коктейл|բար/, icon: "bar-alcohol" },
  { pattern: /juice|հյութ|ըմպելիք|сок|напит/, icon: "juices-drinks" },
  { pattern: /mexican|մեքսիկ|мексик|taco|տակո/, icon: "mexican" },
  {
    pattern: /semi.?finish|կիսաֆաբր|полуфабр|kisafabrik/,
    icon: "semi-finished",
  },
  {
    pattern: /combo|կոմբո|комбо|combo.?pack|կոմբո.?փաթեթ/,
    icon: "combo-packages",
  },
];

function iconUrl(name: string): string {
  // Cache-bust old Next/Image + CDN entries that still hold line-art icons.
  return `${staticAssetUrl(`/assets/categories/icons/${name}.webp`)}?v=cutout13`;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("hy-AM");
}

/**
 * Resolves slug/title to a homepage cutout under `/assets/categories/icons`.
 * Returns `null` when no photo cutout exists for that category.
 */
export function resolveCategoryCutoutSrc(
  slug: string,
  title = "",
): string | null {
  const normalized = normalize(slug);
  if (CATEGORY_ICON_FILES.has(normalized)) {
    return iconUrl(normalized);
  }

  const alias = CATEGORY_ICON_ALIASES[normalized];
  if (alias && CATEGORY_ICON_FILES.has(alias)) {
    return iconUrl(alias);
  }

  const haystack = `${normalized} ${normalize(title)}`;
  for (const rule of TITLE_ICON_RULES) {
    if (rule.pattern.test(haystack) && CATEGORY_ICON_FILES.has(rule.icon)) {
      return iconUrl(rule.icon);
    }
  }

  return null;
}

/**
 * Resolves a local category slug/title to a shop sidebar icon asset path.
 */
export function resolveCategoryIconSrc(slug: string, title = ""): string {
  return (
    resolveCategoryCutoutSrc(slug, title) ??
    staticAssetUrl("/assets/categories/icons/all.webp")
  );
}
