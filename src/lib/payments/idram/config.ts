export type IdramConfig = {
  isTestMode: boolean;
  recAccount: string;
  secretKey: string;
};

/** Read Idram merchant credentials from environment. */
export function getIdramConfig(): IdramConfig {
  const isTestMode = process.env.IDRAM_TEST_MODE === "true";

  const recAccount = isTestMode
    ? process.env.IDRAM_REC_ACCOUNT?.trim()
    : process.env.IDRAM_LIVE_REC_ACCOUNT?.trim() || process.env.IDRAM_REC_ACCOUNT?.trim();

  const secretKey = isTestMode
    ? process.env.IDRAM_SECRET_KEY?.trim()
    : process.env.IDRAM_LIVE_SECRET_KEY?.trim() || process.env.IDRAM_SECRET_KEY?.trim();

  if (!recAccount || !secretKey) {
    throw new Error("Idram credentials are not configured");
  }

  return { isTestMode, recAccount, secretKey };
}
