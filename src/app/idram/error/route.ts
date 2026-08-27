import { handleIdramError } from "@/features/checkout/application/idram-user-return";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live Idram FAIL_URL: https://degusto.am/idram/error */
export function GET(request: Request): Promise<Response> {
  return handleIdramError(request);
}

export function POST(request: Request): Promise<Response> {
  return handleIdramError(request);
}
