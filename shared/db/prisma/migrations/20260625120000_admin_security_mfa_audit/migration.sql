-- Admin MFA + audit log
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaTotpSecret" TEXT;

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_actorId_idx" ON "admin_audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt" DESC);
