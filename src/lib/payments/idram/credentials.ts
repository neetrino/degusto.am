import "server-only";

import { getEnv } from "@/config/env";
import {
  selectIdramCredentials,
  type IdramCredentials,
} from "@/lib/payments/idram/credentials-select";

export type { IdramCredentials };

/** Live env credentials for Idram. Never log the secret. */
export function getIdramCredentials(): IdramCredentials | null {
  return selectIdramCredentials(getEnv());
}
