import { NextRequest } from "next/server";
import { handleIdramCallback } from "@/lib/payments/idram";
import { plainTextResponse } from "@/lib/payments/payment-route-utils";

/** POST /api/v1/payments/idram/callback — Idram RESULT_URL (precheck + confirmation). */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const responseBody = await handleIdramCallback(formData);
  return plainTextResponse(responseBody);
}

/** GET is not used by Idram; return 405. */
export async function GET(req: NextRequest) {
  return plainTextResponse("Method not allowed", 405);
}
