export type AuthTokenClaims = {
  userId: string;
  sessionEpoch: number;
  jti?: string;
  roles?: string[];
};

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const roles = value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  return roles.length > 0 ? roles : undefined;
}

function readNonNegativeInt(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

/** Parses verified JWT payload into session claims. */
export function parseAuthTokenClaims(decoded: unknown): AuthTokenClaims | null {
  if (!decoded || typeof decoded !== 'object') {
    return null;
  }
  const payload = decoded as Record<string, unknown>;
  const userId = payload.userId;
  if (typeof userId !== 'string' || userId.length === 0) {
    return null;
  }
  const jti = typeof payload.jti === 'string' && payload.jti.length > 0 ? payload.jti : undefined;
  return {
    userId,
    sessionEpoch: readNonNegativeInt(payload.sessionEpoch),
    jti,
    roles: readStringArray(payload.roles),
  };
}
