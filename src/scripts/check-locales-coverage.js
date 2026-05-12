const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_ROOT = path.join(ROOT, 'locales');
const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['hy', 'ru'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flattenKeys(input, prefix = '', result = new Set()) {
  if (Array.isArray(input)) {
    result.add(prefix);
    return result;
  }

  if (!isObject(input)) {
    if (prefix) {
      result.add(prefix);
    }
    return result;
  }

  const keys = Object.keys(input);
  if (keys.length === 0 && prefix) {
    result.add(prefix);
    return result;
  }

  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenKeys(input[key], nextPrefix, result);
  }

  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getLocaleFiles(locale) {
  const localeDir = path.join(LOCALES_ROOT, locale);
  if (!fs.existsSync(localeDir)) {
    return [];
  }

  return fs
    .readdirSync(localeDir)
    .filter((name) => name.endsWith('.json'))
    .sort();
}

function run() {
  const baseFiles = getLocaleFiles(BASE_LOCALE);
  const failures = [];

  for (const fileName of baseFiles) {
    const basePath = path.join(LOCALES_ROOT, BASE_LOCALE, fileName);
    const baseData = readJson(basePath);
    const baseKeys = flattenKeys(baseData);

    for (const locale of TARGET_LOCALES) {
      const targetPath = path.join(LOCALES_ROOT, locale, fileName);
      if (!fs.existsSync(targetPath)) {
        failures.push(`[${locale}] missing file: ${fileName}`);
        continue;
      }

      const targetData = readJson(targetPath);
      const targetKeys = flattenKeys(targetData);

      for (const key of baseKeys) {
        if (!targetKeys.has(key)) {
          failures.push(`[${locale}] ${fileName} -> missing key: ${key}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error('Localization coverage check failed:');
    failures.forEach((line) => console.error(`- ${line}`));
    process.exit(1);
  }

  console.log('Localization coverage check passed.');
}

run();
