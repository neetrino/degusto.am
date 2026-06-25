-- Session epoch (DB source of truth) + revoked JWT jti fallback
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sessionEpoch" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "revoked_auth_tokens" (
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revoked_auth_tokens_pkey" PRIMARY KEY ("jti")
);

CREATE INDEX IF NOT EXISTS "revoked_auth_tokens_expiresAt_idx" ON "revoked_auth_tokens"("expiresAt");
