import { handleIdramResult } from "@/features/checkout/application/idram-result";
import {
  idramPlainText,
  parseIdramRequestFields,
} from "@/lib/payments/idram/request-fields";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Live Idram RESULT_URL: https://degusto.am/idram */
export async function GET(request: Request): Promise<Response> {
  const raw = parseIdramRequestFields(new URL(request.url).searchParams);
  return idramPlainText(await handleIdramResult(raw));
}

export async function POST(request: Request): Promise<Response> {
  const raw = parseIdramRequestFields(await request.formData());
  return idramPlainText(await handleIdramResult(raw));
}
