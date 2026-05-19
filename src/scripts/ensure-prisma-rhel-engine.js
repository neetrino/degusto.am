#!/usr/bin/env node

/**
 * Ensures the Vercel/Linux Prisma query engine is available where Prisma looks for it.
 * Run after `prisma generate` (prebuild / Vercel install).
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "../..");
const engineName = "libquery_engine-rhel-openssl-3.0.x.so.node";
const source = path.join(rootDir, "shared/db/src/generated/prisma-client", engineName);

if (!fs.existsSync(source)) {
  console.warn(`[ensure-prisma-rhel-engine] Skip: ${engineName} not found (run db:generate first)`);
  process.exit(0);
}

const targets = [
  path.join(rootDir, "node_modules/.prisma/client", engineName),
  path.join(rootDir, "node_modules/@white-shop/db/src/generated/prisma-client", engineName),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`[ensure-prisma-rhel-engine] Copied → ${path.relative(rootDir, target)}`);
}
