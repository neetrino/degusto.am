export type ArcaBank = "inecobank" | "idbank";

export type ArcaCredentials = {
  userName: string;
  password: string;
  testMode: boolean;
  bank: ArcaBank;
  baseUrl: string;
};

export type ArcaEnvSlice = {
  ARCA_TEST_MODE?: string;
  ARCA_BANK?: string;
  ARCA_USERNAME?: string;
  ARCA_PASSWORD?: string;
  ARCA_LIVE_USERNAME?: string;
  ARCA_LIVE_PASSWORD?: string;
};

export const ARCA_INECO_BASE_URL = "https://pg.inecoecom.am/payment/rest";
export const ARCA_IDBANK_TEST_URL =
  "https://ipaytest.arca.am:8445/payment/rest";
export const ARCA_IDBANK_LIVE_URL = "https://ipay.arca.am/payment/rest";

export function isArcaTestMode(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Degusto production is Ineco. Unknown values fall back to inecobank. */
export function selectArcaBank(value: string | undefined): ArcaBank {
  return value?.trim().toLowerCase() === "idbank" ? "idbank" : "inecobank";
}

export function arcaBaseUrl(bank: ArcaBank, testMode: boolean): string {
  if (bank === "idbank") {
    return testMode ? ARCA_IDBANK_TEST_URL : ARCA_IDBANK_LIVE_URL;
  }
  return ARCA_INECO_BASE_URL;
}

/** Picks test or live Arca username/password. Returns null when the pair is empty. */
export function selectArcaCredentials(
  env: ArcaEnvSlice,
): ArcaCredentials | null {
  const testMode = isArcaTestMode(env.ARCA_TEST_MODE);
  const bank = selectArcaBank(env.ARCA_BANK);
  const userName = testMode
    ? env.ARCA_USERNAME?.trim()
    : env.ARCA_LIVE_USERNAME?.trim();
  const password = testMode
    ? env.ARCA_PASSWORD?.trim()
    : env.ARCA_LIVE_PASSWORD?.trim();
  if (!userName || !password) {
    return null;
  }
  return {
    userName,
    password,
    testMode,
    bank,
    baseUrl: arcaBaseUrl(bank, testMode),
  };
}
