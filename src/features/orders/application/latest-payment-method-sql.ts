import { sql } from "drizzle-orm";

import { payments } from "@/db/schema";

/**
 * Correlated subquery for the latest payments.method on the outer `orders` row.
 * Outer `orders.id` must be table-qualified — otherwise Postgres resolves `id`
 * to `payments.id` and the join never matches.
 */
export const latestPaymentMethodSql = sql<string | null>`(
  select ${payments.method}
  from ${payments}
  where ${payments.orderId} = ${sql.raw('"orders"."id"')}
  order by ${payments.attemptNumber} desc
  limit 1
)`.as("paymentMethod");
