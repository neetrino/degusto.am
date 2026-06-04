const path = require("path");
const fs = require("fs");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split("\n").forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      const eq = t.indexOf("=");
      if (eq > 0) {
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
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
const { upsertFoodAttributes } = require("./lib/upsert-food-attributes.cjs");

async function main() {
  const prisma = new PrismaClient();
  try {
    const attrs = await upsertFoodAttributes(prisma);
    const topping = attrs.topping;
    if (topping) {
      console.log("✅ Food attribute prices synced (topping id:", topping.id, ")");
    } else {
      console.log("✅ Food attribute prices synced");
    }
    console.log("ℹ️ Refresh PDP (cache key bumped to v3) to see updated prices.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
