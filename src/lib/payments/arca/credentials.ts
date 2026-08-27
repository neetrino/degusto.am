import "server-only";

import { getEnv } from "@/config/env";
import {
  selectArcaCredentials,
  type ArcaCredentials,
} from "@/lib/payments/arca/credentials-select";

export type { ArcaCredentials };

/** Live env credentials for Arca. Never log the password. */
export function getArcaCredentials(): ArcaCredentials | null {
  return selectArcaCredentials(getEnv());
}
