import { NextResponse } from "next/server";
import { z } from "zod";

import { listPendingOrderAlerts } from "@/features/orders/application/list-pending-order-alerts";
import { isStaffRole } from "@/features/users/domain/user-lifecycle";
import { getCurrentUser } from "@/lib/auth/session";

const querySchema = z.object({
  after: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid ISO timestamp",
    }),
});

/**
 * Staff-only poll endpoint for new PENDING order alerts.
 * `after` is an ISO timestamp; only later placements are returned.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isStaffRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    after: url.searchParams.get("after") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid after timestamp" }, { status: 400 });
  }

  const rows = await listPendingOrderAlerts(new Date(parsed.data.after));
  const orders = rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    contactName: row.contactName,
    totalAmount: row.totalAmount,
    baseCurrency: row.baseCurrency,
    paymentMethod: row.paymentMethod,
    placedAt: row.placedAt.toISOString(),
  }));

  return NextResponse.json(
    { orders, waitingCount: orders.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
