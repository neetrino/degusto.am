import { handleArcaResult } from "@/features/checkout/application/arca-result";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live Ineco returnUrl: https://degusto.am/inecobank/result */
export function GET(request: Request): Promise<Response> {
  return handleArcaResult(request);
}

export function POST(request: Request): Promise<Response> {
  return handleArcaResult(request);
}
