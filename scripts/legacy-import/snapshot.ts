import { neon } from "@neondatabase/serverless";

import type { NeonSnapshot } from "./types";

type UserRow = { id: string; email: string };
type AddressRow = { id: string };
type OrderRow = { order_number: string };
type ProductRow = { id: string; sku: string };

function requireRows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Neon ${label} query did not return rows`);
  }
  return value as T[];
}

export function neonHost(databaseUrl: string): string {
  const normalized = databaseUrl.replace(/^postgres(ql)?:/i, "https:");
  return new URL(normalized).host;
}

export async function loadNeonSnapshot(
  databaseUrl: string,
): Promise<NeonSnapshot> {
  const sql = neon(databaseUrl);
  const [userRows, addressRows, orderRows, productRows] = await Promise.all([
    sql`SELECT id, email FROM users`,
    sql`SELECT id FROM addresses`,
    sql`SELECT order_number FROM orders`,
    sql`SELECT id, sku FROM products WHERE deleted_at IS NULL`,
  ]);

  const users = requireRows<UserRow>(userRows, "users");
  const addresses = requireRows<AddressRow>(addressRows, "addresses");
  const orders = requireRows<OrderRow>(orderRows, "orders");
  const products = requireRows<ProductRow>(productRows, "products");

  const usersByEmail = new Map<string, string>();
  const userIds = new Set<string>();
  for (const user of users) {
    usersByEmail.set(user.email.toLowerCase(), user.id);
    userIds.add(user.id);
  }

  return {
    host: neonHost(databaseUrl),
    usersByEmail,
    userIds,
    addressIds: new Set(addresses.map((row) => row.id)),
    orderNumbers: new Set(orders.map((row) => row.order_number)),
    products: products.map((row) => ({ id: row.id, sku: row.sku })),
  };
}
