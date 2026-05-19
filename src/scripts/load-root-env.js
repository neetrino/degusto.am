#!/usr/bin/env node

/**
 * Load root `.env` then `.env.local` (later overrides) for Node scripts (migrations, baseline).
 * Does not replace variables already set in the process environment.
 */

const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) {
      continue;
    }
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\r?\n/g, "");
  }
}

/**
 * @param {string} [rootDir] Project root (defaults to repo root from this file).
 */
function loadRootEnv(rootDir) {
  const root = rootDir ?? path.join(__dirname, "../..");
  parseEnvFile(path.join(root, ".env"));
  parseEnvFile(path.join(root, ".env.local"));
}

module.exports = { loadRootEnv };
