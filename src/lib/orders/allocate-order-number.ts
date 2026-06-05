import { Prisma } from "@prisma/client";
import type { Prisma as PrismaTypes } from "@prisma/client";
import {
  ORDER_NUMBER_COUNTER_ID,
  ORDER_NUMBER_START,
} from "./order-number.constants";

type NextValueRow = { next_value: number };

/**
 * Allocates the next order number as (highest existing order number + 1),
 * with a floor of {@link ORDER_NUMBER_START}. Serialized via row lock.
 */
export async function allocateOrderNumber(
  tx: PrismaTypes.TransactionClient
): Promise<string> {
  const floor = ORDER_NUMBER_START - 1;

  await tx.$executeRaw(
    Prisma.sql`
      INSERT INTO order_number_counter (id, value)
      VALUES (${ORDER_NUMBER_COUNTER_ID}, ${floor})
      ON CONFLICT (id) DO NOTHING
    `
  );

  const rows = await tx.$queryRaw<NextValueRow[]>(
    Prisma.sql`
      WITH locked AS (
        SELECT value
        FROM order_number_counter
        WHERE id = ${ORDER_NUMBER_COUNTER_ID}
        FOR UPDATE
      ),
      next_num AS (
        SELECT GREATEST(
          ${ORDER_NUMBER_START},
          COALESCE(
            (
              SELECT MAX(number::INTEGER)
              FROM orders
              WHERE number ~ '^[0-9]+$'
            ),
            ${floor}
          ) + 1
        ) AS value
      )
      UPDATE order_number_counter
      SET value = (SELECT value FROM next_num)
      WHERE id = ${ORDER_NUMBER_COUNTER_ID}
      RETURNING value AS next_value
    `
  );

  const nextValue = rows[0]?.next_value;
  if (nextValue === undefined) {
    throw new Error("Failed to allocate order number");
  }

  return String(nextValue);
}
