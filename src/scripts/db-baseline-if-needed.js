#!/usr/bin/env node
/**
 * When `migrate deploy` fails on a non-empty DB (e.g. P3005) but the live
 * database already matches `schema.prisma` (verified via empty migrate diff),
 * mark all migration folders as applied, then run `migrate deploy` again.
 *
 * Loads root `.env` (same pattern as `run-migrations.js`).
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function loadRootEnv() {
  const rootDir = path.join(__dirname, "../..");
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env at project root:", envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/\\"/g, '"');
        }
        if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1).replace(/\\'/g, "'");
        }
        process.env[key] = val;
      }
    }
  }
  return rootDir;
}

function listMigrationNames(migrationsDir) {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        fs.existsSync(path.join(migrationsDir, d.name, "migration.sql"))
    )
    .map((d) => d.name)
    .sort();
}

function diffHasExecutableSql(diffScript) {
  const lines = diffScript
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("--"));
  return lines.length > 0;
}

const rootDir = loadRootEnv();
const dbDir = path.join(rootDir, "shared/db");
const migrationsDir = path.join(dbDir, "prisma/migrations");

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("DATABASE_URL and DIRECT_URL must be set in .env");
  process.exit(1);
}

process.chdir(dbDir);

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

try {
  console.log("🔄 Trying prisma migrate deploy…");
  run("pnpm run db:migrate:deploy");
  console.log("✅ migrate deploy already OK.");
  process.exit(0);
} catch {
  console.log("⚠️  migrate deploy failed; checking DB vs schema…");
}

const diffScript = execSync(
  "pnpm exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script",
  { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, env: process.env }
);

if (diffHasExecutableSql(diffScript)) {
  console.error(
    "❌ Refusing baseline: database differs from schema.prisma. Fix drift first, then retry."
  );
  console.error(diffScript.slice(0, 4000));
  process.exit(1);
}

console.log("✅ Empty diff (DB matches schema). Marking migrations as applied…");

const names = listMigrationNames(migrationsDir);
for (const name of names) {
  try {
    run(`pnpm exec prisma migrate resolve --applied "${name}"`);
  } catch {
    console.log("   ⚠ migrate resolve failed (lock/timeout or already applied):", name);
  }
}

console.log("🔁 Running migrate deploy after baseline…");
run("pnpm run db:migrate:deploy");
console.log("✅ Baseline complete; migrate deploy succeeded.");
