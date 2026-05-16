import { NextResponse } from "next/server";
import {
  buildDatabaseUrlLogFields,
  mergePostgresConnectionUrlTuning,
} from "@white-shop/db";
import { pingDatabase } from "@/lib/db/ping-database";

function safeDatabaseConfigHint(): ReturnType<typeof buildDatabaseUrlLogFields> {
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  const directUrl = (process.env.DIRECT_URL ?? "").trim();
  return buildDatabaseUrlLogFields(
    databaseUrl ? mergePostgresConnectionUrlTuning(databaseUrl) : "",
    directUrl ? mergePostgresConnectionUrlTuning(directUrl) : ""
  );
}

/**
 * GET /api/health/db
 * Verifies PostgreSQL connectivity from the Vercel runtime (no secrets in response).
 */
export async function GET() {
  const config = safeDatabaseConfigHint();
  const result = await pingDatabase();
  if (result.ok) {
    return NextResponse.json(
      {
        status: "ok",
        database: "up",
        latencyMs: result.latencyMs,
        config,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      status: "error",
      database: "down",
      reason: result.reason,
      prismaCode: "prismaCode" in result ? result.prismaCode : undefined,
      hint: "hint" in result ? result.hint : undefined,
      config,
      checks: {
        usePooledDatabaseUrl: config.databaseLikelyNeonPooler,
        neonDriverAdapter: config.neonDriverAdapter,
        vercelRuntime: config.vercelRuntime,
      },
      fixSteps: [
        "Neon → Connection string → Pooled → copy into Vercel DATABASE_URL (no quotes).",
        "Neon → Direct → copy into Vercel DIRECT_URL (no quotes).",
        "Vercel → Redeploy after saving env vars.",
        "If password was rotated in Neon, update both URLs in Vercel.",
      ],
    },
    { status: 503, headers: { "Retry-After": "15" } }
  );
}
