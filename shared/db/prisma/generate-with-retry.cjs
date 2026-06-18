#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1200;
const GENERATED_CLIENT_MARKERS = [
  join(process.cwd(), "..", "..", "node_modules", "@prisma", "client", "index.d.ts"),
  join(process.cwd(), "..", "..", "node_modules", ".prisma", "client", "index.d.ts"),
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function shouldRetry(stderr, stdout) {
  const output = `${stdout}\n${stderr}`;
  return output.includes("EPERM: operation not permitted, rename");
}

function hasGeneratedClient() {
  return GENERATED_CLIENT_MARKERS.some((filePath) => existsSync(filePath));
}

let lastExitCode = 1;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = spawnSync("pnpm", ["exec", "prisma", "generate"], {
    stdio: "pipe",
    shell: process.platform === "win32",
    encoding: "utf8",
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  const exitCode = typeof result.status === "number" ? result.status : 1;
  lastExitCode = exitCode;
  const lockError = shouldRetry(stderr, stdout);

  if (exitCode === 0) {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    process.exit(0);
  }

  if (!lockError) {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  }

  if (hasGeneratedClient()) {
    process.stdout.write(
      "Prisma generate skipped due to Windows file lock; using existing generated client.\n"
    );
    process.exit(0);
  }

  if (attempt === MAX_ATTEMPTS) {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  }

  process.stderr.write(
    `Prisma generate failed with Windows file lock (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${RETRY_DELAY_MS}ms...\n`
  );
  sleep(RETRY_DELAY_MS);
}

process.exit(lastExitCode);
