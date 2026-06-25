import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { createProblem } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";
import { initiateArcaPayment } from "@/lib/payments/arca";

type ArcaInitBody = {
  orderNumber?: string;
  lang?: string;
};

/** POST /api/v1/payments/arca/init — register order in Arca and return redirect URL. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ArcaInitBody;
    const orderNumber = body.orderNumber?.trim();

    if (!orderNumber) {
      return problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: "orderNumber is required",
          instance: req.url,
        })
      );
    }

    const result = await initiateArcaPayment({
      orderNumber,
      lang: body.lang?.trim(),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[PAYMENTS] Arca init");
  }
}
