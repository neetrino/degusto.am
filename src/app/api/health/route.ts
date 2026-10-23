import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICE_NAME = "degusto";

/**
 * Lightweight public probe for Uptime Kuma.
 * Does not touch the database or any external dependency.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
