export type IdramCredentials = {
  recAccount: string;
  secretKey: string;
  testMode: boolean;
};

export type IdramEnvSlice = {
  IDRAM_TEST_MODE?: string;
  IDRAM_REC_ACCOUNT?: string;
  IDRAM_SECRET_KEY?: string;
  IDRAM_LIVE_REC_ACCOUNT?: string;
  IDRAM_LIVE_SECRET_KEY?: string;
};

export function isIdramTestMode(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Picks test or live Idram account/secret. Returns null when the pair is empty. */
export function selectIdramCredentials(
  env: IdramEnvSlice,
): IdramCredentials | null {
  const testMode = isIdramTestMode(env.IDRAM_TEST_MODE);
  const recAccount = testMode
    ? env.IDRAM_REC_ACCOUNT?.trim()
    : env.IDRAM_LIVE_REC_ACCOUNT?.trim();
  const secretKey = testMode
    ? env.IDRAM_SECRET_KEY?.trim()
    : env.IDRAM_LIVE_SECRET_KEY?.trim();
  if (!recAccount || !secretKey) {
    return null;
  }
  return { recAccount, secretKey, testMode };
}
