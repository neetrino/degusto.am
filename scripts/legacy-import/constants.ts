import path from "node:path";
import { fileURLToPath } from "node:url";

/** RFC 4122 DNS namespace — stable UUIDv5 base for legacy keys. */
export const LEGACY_UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export const GUEST_EMAIL_DOMAIN = "guest.import.local";
export const ORDER_NUMBER_PREFIX = "o";
export const DEFAULT_CITY = "Yerevan";
export const DEFAULT_COUNTRY = "AM";
export const DEFAULT_LOCALE = "hy";
export const UNKNOWN_PHONE = "unknown";
export const FALLBACK_FIRST_NAME = "User";
export const FALLBACK_LAST_NAME = "-";

export const APPLY_ENV_VALUE = "YES";
export const APPLY_ENV_NAME = "LEGACY_IMPORT_APPLY";

export const BATCH_USERS = 200;
export const BATCH_ADDRESSES = 200;
export const BATCH_ORDERS = 80;
export const BATCH_CHILDREN = 200;

export const PROTECTED_EMAILS = [
  "admin@degusto.com",
  "mariam@degusto.com",
  "customer@degusto.local",
  "test67@gmail.com",
  "manwellllambaryaniii@gmail.com",
] as const;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_DUMP_PATH = path.resolve(
  SCRIPT_DIR,
  "../../../../Old/main_main_degusto.sql",
);

export const STATE_DIR = path.resolve(SCRIPT_DIR, "state");
export const DRY_RUN_REPORT_PATH = path.join(STATE_DIR, "dry-run-report.json");

export const DUMP_TABLES = [
  "users",
  "addresses",
  "orders",
  "order_products",
] as const;

export type DumpTable = (typeof DUMP_TABLES)[number];
