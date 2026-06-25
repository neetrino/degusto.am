export type ArcaBank = "idbank" | "inecobank" | "epg" | "custom";

export type ArcaConfig = {
  isTestMode: boolean;
  bank: ArcaBank;
  username: string;
  password: string;
  apiBaseUrl: string;
  currencyCode: string;
};

const IDBANK_URLS = {
  test: "https://ipaytest.arca.am:8445/payment/rest",
  live: "https://ipay.arca.am/payment/rest",
} as const;

const INECOBANK_URLS = {
  test: "https://pg.inecoecom.am/payment/rest",
  live: "https://pg.inecoecom.am/payment/rest",
} as const;

const DEFAULT_TESTEPG_URL = "https://testepg.arca.am/payment/rest";
const PAYMENT_REST_SUFFIX = "/payment/rest";

function readEnvValue(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

function normalizeBank(raw: string | undefined): ArcaBank {
  const bank = raw?.trim().toLowerCase() || "idbank";
  if (bank === "epg" || bank === "testepg") {
    return "epg";
  }
  if (bank === "custom") {
    return "custom";
  }
  if (bank === "inecobank") {
    return "inecobank";
  }
  return "idbank";
}

function resolveIsTestMode(bank: ArcaBank): boolean {
  if (process.env.ARCA_TEST_MODE === "true") {
    return true;
  }
  if (process.env.ARCA_TEST_MODE === "false") {
    return false;
  }
  if (bank === "epg") {
    return true;
  }

  const baseUrl = process.env.ARCA_API_BASE_URL?.trim();
  return Boolean(
    baseUrl?.includes("testepg.arca.am") || baseUrl?.includes("ipaytest.arca.am")
  );
}

/** Ensure base URL ends with /payment/rest (Postman: testepg.arca.am/payment/rest). */
function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed.endsWith(PAYMENT_REST_SUFFIX)) {
    return trimmed;
  }
  if (trimmed.endsWith("/epg/rest")) {
    return trimmed.replace(/\/epg\/rest$/, PAYMENT_REST_SUFFIX);
  }
  return `${trimmed}${PAYMENT_REST_SUFFIX}`;
}

function resolveApiBaseUrl(bank: ArcaBank, isTestMode: boolean): string {
  const custom = process.env.ARCA_API_BASE_URL?.trim();
  if (custom) {
    return normalizeApiBaseUrl(custom);
  }

  if (bank === "epg" || bank === "custom") {
    return DEFAULT_TESTEPG_URL;
  }

  if (bank === "inecobank") {
    return isTestMode ? INECOBANK_URLS.test : INECOBANK_URLS.live;
  }

  return isTestMode ? IDBANK_URLS.test : IDBANK_URLS.live;
}

/** Read Arca credentials and API base URL from environment. */
export function getArcaConfig(): ArcaConfig {
  const bank = normalizeBank(process.env.ARCA_BANK);
  const isTestMode = resolveIsTestMode(bank);

  const username = isTestMode
    ? readEnvValue(["ARCA_API_USERNAME", "ARCA_USERNAME"])
    : readEnvValue(["ARCA_LIVE_USERNAME", "ARCA_API_USERNAME", "ARCA_USERNAME"]);

  const password = isTestMode
    ? readEnvValue(["ARCA_API_PASSWORD", "ARCA_PASSWORD"])
    : readEnvValue(["ARCA_LIVE_PASSWORD", "ARCA_API_PASSWORD", "ARCA_PASSWORD"]);

  if (!username || !password) {
    throw new Error("Arca credentials are not configured");
  }

  return {
    isTestMode,
    bank,
    username,
    password,
    apiBaseUrl: resolveApiBaseUrl(bank, isTestMode),
    currencyCode: readEnvValue(["ARCA_CURRENCY_CODE"]) ?? "051",
  };
}

/** Whether Arca card checkout is exposed in the storefront UI. */
export function isArcaCheckoutEnabled(): boolean {
  return process.env.ARCA_CHECKOUT_ENABLED === "true";
}
