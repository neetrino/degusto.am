import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db/ping-database";

/**
 * GET /api/health/db
 * Verifies PostgreSQL connectivity from the Vercel runtime (no secrets in response).
 */
export async function GET() {
  const result = await pingDatabase();
  if (result.ok) {
    return NextResponse.json(
      {
        status: "ok",
        database: "up",
        latencyMs: result.latencyMs,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      status: "error",
      database: "down",
      reason: result.reason,
    },
    { status: 503, headers: { "Retry-After": "15" } }
  );
}
