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
const { loadRootEnv } = require("./load-root-env");

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

const rootDir = path.join(__dirname, "../..");
loadRootEnv(rootDir);
if (!fs.existsSync(path.join(rootDir, ".env")) && !fs.existsSync(path.join(rootDir, ".env.local"))) {
  console.error("Missing .env or .env.local at project root:", rootDir);
  process.exit(1);
}
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
