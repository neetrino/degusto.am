import type { SeedCatalogCategory } from "@/db/seed/figma-catalog";
import { seedFigmaCatalog } from "@/db/seed/figma-catalog";

/** Menu categories from Figma DEGUSTO-DEV-1 (node 64:1946). */
export const seedMenuCategories: ReadonlyArray<SeedCatalogCategory> =
  seedFigmaCatalog.categories;
