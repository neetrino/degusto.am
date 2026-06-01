const JWT_EXPIRES_IN_DEFAULT_SECONDS = 7 * 24 * 60 * 60;

const EXPIRES_IN_PATTERN = /^(\d+)([smhdw])$/;

/**
 * Converts JWT `expiresIn` strings (e.g. `7d`, `24h`) to cookie `maxAge` seconds.
 */
export function jwtExpiresInToMaxAgeSeconds(value?: string): number {
  const raw = (value ?? process.env.JWT_EXPIRES_IN ?? "7d").trim();
  const match = EXPIRES_IN_PATTERN.exec(raw);
  if (!match) {
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) && asNumber > 0
      ? asNumber
      : JWT_EXPIRES_IN_DEFAULT_SECONDS;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };
  return amount * (multipliers[unit] ?? 86400);
}
