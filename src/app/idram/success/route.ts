import { handleIdramSuccess } from "@/features/checkout/application/idram-user-return";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live Idram SUCCESS_URL: https://degusto.am/idram/success */
export function GET(request: Request): Promise<Response> {
  return handleIdramSuccess(request);
}

export function POST(request: Request): Promise<Response> {
  return handleIdramSuccess(request);
}
