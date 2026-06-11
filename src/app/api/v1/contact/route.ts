import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { createProblem } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";
import { safeParseContact } from "@/lib/schemas/contact.schema";
import { enforceRouteRateLimit } from "@/lib/http/route-rate-limit";

/**
 * POST /api/v1/contact
 * Submit contact form
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRouteRateLimit(req, {
      prefix: "ratelimit:contact",
      limit: 8,
      window: "60 s",
      detail: "Too many contact requests. Try again later.",
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json();
    const parsed = safeParseContact(body);
    if (!parsed.success) {
      return problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: parsed.error.issues[0]?.message ?? "Invalid contact payload",
          instance: req.url,
        })
      );
    }
    const { name, email, subject, message } = parsed.data;

    const normalizedSubject = typeof subject === "string" ? subject.trim() : "";

    // Create contact message
    const contactMessage = await db.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        subject: normalizedSubject,
        message: message.trim(),
      },
    });

    return NextResponse.json(
      {
        data: {
          id: contactMessage.id,
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          message: contactMessage.message,
          createdAt: contactMessage.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CONTACT] POST");
  }
}



