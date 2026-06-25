import { db } from '@white-shop/db';

/** Reads authoritative session epoch from PostgreSQL. */
export async function getUserSessionEpochFromDb(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { sessionEpoch: true },
  });
  return user?.sessionEpoch ?? 0;
}

/** Increments session epoch in PostgreSQL and returns the new value. */
export async function incrementUserSessionEpochInDb(userId: string): Promise<number> {
  const updated = await db.user.update({
    where: { id: userId },
    data: { sessionEpoch: { increment: 1 } },
    select: { sessionEpoch: true },
  });
  return updated.sessionEpoch;
}

/** Persists a revoked JWT `jti` until natural expiry. */
export async function persistRevokedJtiInDb(jti: string, expiresAt: Date): Promise<void> {
  await db.revokedAuthToken.upsert({
    where: { jti },
    create: { jti, expiresAt },
    update: { expiresAt },
  });
}

/** Returns true when the JWT `jti` is revoked in PostgreSQL. */
export async function isJtiRevokedInDb(jti: string): Promise<boolean> {
  const row = await db.revokedAuthToken.findUnique({
    where: { jti },
    select: { expiresAt: true },
  });
  if (!row) {
    return false;
  }
  return row.expiresAt > new Date();
}
