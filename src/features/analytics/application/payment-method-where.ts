import "server-only";

import { sql, type SQL } from "drizzle-orm";

import { orders, payments } from "@/db/schema";
import {
  paymentMethodDbAliases,
  type AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";

/**
 * Correlated latest `payments.method` for the outer `orders` row.
 * Safe when the outer query is from `orders` (table-qualified id).
 */
export function latestPaymentMethodSqlExpr(): SQL {
  return sql`(
    select ${payments.method}
    from ${payments}
    where ${payments.orderId} = ${orders.id}
    order by ${payments.attemptNumber} desc
    limit 1
  )`;
}

/**
 * Restricts orders whose latest payment method matches the filter.
 * Returns `undefined` when filter is `all` so callers can omit it from `and()`.
 */
export function paymentMethodFilterWhere(
  filter: AnalyticsPaymentMethodFilter,
): SQL | undefined {
  if (filter === "all") {
    return undefined;
  }

  return latestPaymentMethodInAliases(paymentMethodDbAliases(filter));
}

function latestPaymentMethodInAliases(aliases: readonly string[]): SQL {
  const values = sql.join(
    aliases.map((alias) => sql`${alias}`),
    sql`, `,
  );

  return sql`lower(${latestPaymentMethodSqlExpr()}) in (${values})`;
}

/**
 * SQL CASE that buckets latest payment method into cash / idram / arca / other.
 * Uses `CASE expr WHEN` so the correlated subquery is evaluated once.
 */
export function latestPaymentMethodBucketSql(): SQL<string> {
  return sql<string>`
    case lower(${latestPaymentMethodSqlExpr()})
      when 'cash' then 'cash'
      when 'cod' then 'cash'
      when 'cache' then 'cash'
      when 'idram' then 'idram'
      when 'arca' then 'arca'
      else 'other'
    end
  `;
}
