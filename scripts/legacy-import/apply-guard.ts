import { APPLY_ENV_NAME, APPLY_ENV_VALUE } from "./constants";

export function applyRefusal(
  argv: readonly string[],
  envValue: string | undefined,
): string | null {
  if (!argv.includes("--apply")) {
    return null;
  }
  if (envValue !== APPLY_ENV_VALUE) {
    return `Refusing apply: pass --apply and set ${APPLY_ENV_NAME}=${APPLY_ENV_VALUE}`;
  }
  return null;
}
