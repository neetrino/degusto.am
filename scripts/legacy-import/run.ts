import path from "node:path";

import { config as loadEnv } from "dotenv";

import {
  APPLY_ENV_NAME,
  DEFAULT_DUMP_PATH,
  DRY_RUN_REPORT_PATH,
} from "./constants";
import { applyRefusal } from "./apply-guard";
import { applyPlan } from "./apply";
import { buildImportPlan } from "./plan";
import { buildReport, printCounts, writeReport } from "./report";
import { loadNeonSnapshot } from "./snapshot";

loadEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });

function dumpPath(): string {
  return process.env.LEGACY_DUMP_PATH?.trim() || DEFAULT_DUMP_PATH;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is missing in .env (read-only for dry-run)");
  }
  return url;
}

function wantsApply(argv: string[]): boolean {
  return argv.includes("--apply");
}

function assertApplyGuard(argv: string[]): void {
  const refusal = applyRefusal(argv, process.env[APPLY_ENV_NAME]);
  if (refusal) {
    throw new Error(refusal);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  assertApplyGuard(argv);
  const databaseUrl = requireDatabaseUrl();
  const dump = dumpPath();
  const snapshot = await loadNeonSnapshot(databaseUrl);
  const plan = await buildImportPlan(dump, snapshot);
  const report = buildReport(plan, snapshot, dump);
  writeReport(DRY_RUN_REPORT_PATH, report);
  printCounts(report);

  if (!wantsApply(argv)) {
    console.log(`dry-run report: ${DRY_RUN_REPORT_PATH}`);
    return;
  }

  const result = await applyPlan(databaseUrl, plan);
  console.log(JSON.stringify({ applied: true, ...result }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exitCode = 1;
});
