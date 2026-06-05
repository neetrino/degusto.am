const path = require("path");
const fs = require("fs");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  });
}

loadEnv(path.join(__dirname, "../../.env"));
loadEnv(path.join(process.cwd(), ".env"));

const { PrismaClient } = require("@prisma/client");
const { FIGMA_ALL_CATEGORY_ICON_URL, FIGMA_MENU_CATEGORIES } = require("./data/figma-menu-categories.cjs");
const { resolveCategoryIconUrl } = require("./seed-category-icons.cjs");

const prisma = new PrismaClient();

async function main() {
  console.log("=== Fix category icons ===");
  let updated = 0;

  const allIconUrl = await resolveCategoryIconUrl("all", FIGMA_ALL_CATEGORY_ICON_URL, {
    forceRefresh: true,
  });
  if (allIconUrl) {
    console.log(`[Fix] all -> ${allIconUrl}`);
  } else {
    console.warn("[Fix] Missing icon for all");
  }

  for (let index = 0; index < FIGMA_MENU_CATEGORIES.length; index++) {
    const category = FIGMA_MENU_CATEGORIES[index];
    const iconUrl = await resolveCategoryIconUrl(category.slug, category.iconUrl, {
      forceRefresh: true,
    });
    if (!iconUrl) {
      console.warn(`[Fix] Missing icon for ${category.slug}`);
      continue;
    }

    const existing = await prisma.category.findFirst({
      where: {
        translations: { some: { slug: category.slug, locale: "en" } },
      },
      select: { id: true },
    });

    if (!existing) {
      console.warn(`[Fix] Category not found in DB: ${category.slug}`);
      continue;
    }

    await prisma.category.update({
      where: { id: existing.id },
      data: {
        position: index,
        published: true,
        media: [{ url: iconUrl }],
      },
    });

    console.log(`[Fix] ${category.slug} -> ${iconUrl}`);
    updated += 1;
  }

  console.log(`=== Done (${updated} categories updated) ===`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
