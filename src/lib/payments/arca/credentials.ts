import "server-only";

import {
  selectArcaCredentials,
  type ArcaCredentials,
} from "@/lib/payments/arca/credentials-select";

export type { ArcaCredentials };

/** Live env credentials for Arca. Never log the password. */
export function getArcaCredentials(): ArcaCredentials | null {
  return selectArcaCredentials({
    ARCA_TEST_MODE: process.env.ARCA_TEST_MODE,
    ARCA_BANK: process.env.ARCA_BANK,
    ARCA_USERNAME: process.env.ARCA_USERNAME,
    ARCA_PASSWORD: process.env.ARCA_PASSWORD,
    ARCA_LIVE_USERNAME: process.env.ARCA_LIVE_USERNAME,
    ARCA_LIVE_PASSWORD: process.env.ARCA_LIVE_PASSWORD,
  });
}
