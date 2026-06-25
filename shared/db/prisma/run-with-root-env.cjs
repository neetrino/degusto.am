#!/usr/bin/env node

/**
 * Runs Prisma CLI with root `.env` / `.env.local` loaded (repo root, not shared/db).
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { loadRootEnv } = require('../../../src/scripts/load-root-env');

const dbPackageDir = path.join(__dirname, '..');
const rootDir = path.join(dbPackageDir, '../..');
loadRootEnv(rootDir);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node run-with-root-env.cjs <prisma-subcommand> [...args]');
  process.exit(1);
}

const result = spawnSync('pnpm', ['exec', 'prisma', ...args], {
  stdio: 'inherit',
  cwd: dbPackageDir,
  env: process.env,
});

process.exit(result.status ?? 1);
