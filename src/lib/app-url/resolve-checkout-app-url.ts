import "server-only";

import { headers } from "next/headers";

import { getEnv } from "@/config/env";

function isLocalHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.startsWith("localhost:") ||
    normalized.startsWith("127.0.0.1:")
  );
}

/**
 * Checkout return URLs must match the port the shopper uses locally.
 * In production we keep the configured public app URL.
 */
export async function resolveCheckoutAppUrl(): Promise<string> {
  const envUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "development") {
    return envUrl;
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host || !isLocalHost(host)) {
    return envUrl;
  }

  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
