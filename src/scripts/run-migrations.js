#!/usr/bin/env node

/**
 * Deploy Prisma migrations before production build.
 * Loads `.env` + `.env.local` from project root.
 *
 * Exit codes:
 * - 0: migrations (or db push fallback) succeeded, or no DATABASE_URL (CI without DB)
 * - 1: DATABASE_URL is set but migration/push failed (Vercel/CI must fail the build)
 */

const { execSync } = require("child_process");
const path = require("path");
const { loadRootEnv } = require("./load-root-env");

const rootDir = path.join(__dirname, "../..");
loadRootEnv(rootDir);

const dbPath = path.join(rootDir, "shared/db");
const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
const isVercel = process.env.VERCEL === "1";
const mustSucceed = Boolean(databaseUrl) && (isVercel || process.env.CI === "true");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: dbPath, env: process.env });
}

if (!databaseUrl) {
  console.log("⏭️  Skipping migrations: DATABASE_URL is not set");
  process.exit(0);
}

try {
  console.log("🔄 Deploying Prisma migrations…");
  run("pnpm run db:migrate:deploy");
  console.log("✅ Migrations deployed successfully");
  process.exit(0);
} catch (migrateError) {
  console.warn("⚠️  migrate deploy failed, trying db push…");
  try {
    run("pnpm run db:push");
    console.log("✅ Database schema pushed successfully");
    process.exit(0);
  } catch (pushError) {
    console.error("❌ Database schema update failed");
    if (mustSucceed) {
      process.exit(1);
    }
    console.warn("   Continuing build without DB (local/CI without strict DB requirement)");
    process.exit(0);
  }
}
