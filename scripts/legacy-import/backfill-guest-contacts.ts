/**
 * Backfill legacy Guest contact placeholders on Neon orders.
 *
 * Dry-run (default): reports match / phone-label counts.
 * Apply: LEGACY_IMPORT_APPLY=YES pnpm exec tsx scripts/legacy-import/backfill-guest-contacts.ts --apply
 *
 * Does not attach userId (shared phones must not steal ownership).
 * Updates contact snapshot + shipping/billing recipient names only.
 */
import path from "node:path";

import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

import { APPLY_ENV_NAME } from "./constants";
import { applyRefusal } from "./apply-guard";
import {
  guestContactFromAvailable,
  phoneMatchKey,
  type MatchedContactUser,
} from "./guest-contact";

loadEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const BATCH_SIZE = 100;
const PLACEHOLDER_NAME = "Guest";

type AddressSnapshot = {
  recipientFirstName: string;
  recipientLastName: string;
  phone: string;
  countryCode: string;
  region?: string;
  city: string;
  line1: string;
  line2?: string;
  postalCode?: string;
};

type GuestOrderRow = {
  id: string;
  order_number: string;
  contact_phone: string;
  shipping_address: AddressSnapshot;
  billing_address: AddressSnapshot;
};

type UserPhoneRow = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

type PlannedUpdate = {
  id: string;
  orderNumber: string;
  contactEmail: string;
  contactName: string;
  firstName: string;
  lastName: string;
  matched: boolean;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
};

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is missing in .env");
  }
  return url;
}

function withRecipient(
  address: AddressSnapshot,
  firstName: string,
  lastName: string,
): AddressSnapshot {
  return {
    ...address,
    recipientFirstName: firstName,
    recipientLastName: lastName,
  };
}

function buildUserPhoneIndex(
  users: UserPhoneRow[],
): Map<string, MatchedContactUser> {
  const byPhone = new Map<string, MatchedContactUser>();
  for (const user of users) {
    const key = phoneMatchKey(user.phone);
    if (!key || byPhone.has(key)) {
      continue;
    }
    byPhone.set(key, {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });
  }
  return byPhone;
}

function planUpdates(
  orders: GuestOrderRow[],
  usersByPhone: Map<string, MatchedContactUser>,
): PlannedUpdate[] {
  const updates: PlannedUpdate[] = [];
  for (const order of orders) {
    const oldIdMatch = /^o(\d+)$/.exec(order.order_number);
    const oldId = oldIdMatch ? Number(oldIdMatch[1]) : 0;
    const matched =
      usersByPhone.get(phoneMatchKey(order.contact_phone)) ?? null;
    const contact = guestContactFromAvailable({
      oldId,
      phone: order.contact_phone,
      matched,
    });
    updates.push({
      id: order.id,
      orderNumber: order.order_number,
      contactEmail: contact.contactEmail,
      contactName: contact.contactName,
      firstName: contact.firstName,
      lastName: contact.lastName,
      matched: matched != null,
      shippingAddress: withRecipient(
        order.shipping_address,
        contact.firstName,
        contact.lastName,
      ),
      billingAddress: withRecipient(
        order.billing_address,
        contact.firstName,
        contact.lastName,
      ),
    });
  }
  return updates;
}

async function applyUpdates(
  databaseUrl: string,
  updates: PlannedUpdate[],
): Promise<number> {
  const sql = neon(databaseUrl);
  let applied = 0;
  for (let index = 0; index < updates.length; index += BATCH_SIZE) {
    const batch = updates.slice(index, index + BATCH_SIZE);
    await Promise.all(
      batch.map((row) =>
        sql`
          UPDATE orders
          SET
            contact_name = ${row.contactName},
            contact_email = ${row.contactEmail},
            shipping_address = ${JSON.stringify(row.shippingAddress)}::jsonb,
            billing_address = ${JSON.stringify(row.billingAddress)}::jsonb,
            updated_at = NOW()
          WHERE id = ${row.id}::uuid
            AND contact_name = ${PLACEHOLDER_NAME}
        `,
      ),
    );
    applied += batch.length;
    console.log(`applied ${applied}/${updates.length}`);
  }
  return applied;
}

function requireRows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Neon ${label} query did not return rows`);
  }
  return value as T[];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const refusal = applyRefusal(argv, process.env[APPLY_ENV_NAME]);
  if (refusal) {
    throw new Error(refusal);
  }

  const databaseUrl = requireDatabaseUrl();
  const sql = neon(databaseUrl);

  const [guestOrderRows, userRows] = await Promise.all([
    sql`
      SELECT id, order_number, contact_phone, shipping_address, billing_address
      FROM orders
      WHERE contact_name = ${PLACEHOLDER_NAME}
    `,
    sql`
      SELECT first_name, last_name, email, phone
      FROM users
      WHERE phone IS NOT NULL AND btrim(phone) <> ''
    `,
  ]);

  const guestOrders = requireRows<GuestOrderRow>(guestOrderRows, "guest orders");
  const users = requireRows<UserPhoneRow>(userRows, "users");

  const usersByPhone = buildUserPhoneIndex(users);
  const updates = planUpdates(guestOrders, usersByPhone);
  const matched = updates.filter((row) => row.matched).length;
  const phoneLabeled = updates.length - matched;

  console.log(
    JSON.stringify(
      {
        guestOrders: guestOrders.length,
        plannedUpdates: updates.length,
        matchedFromUsers: matched,
        phoneAsName: phoneLabeled,
        sample: updates.slice(0, 5).map((row) => ({
          orderNumber: row.orderNumber,
          contactName: row.contactName,
          contactEmail: row.contactEmail,
          matched: row.matched,
        })),
      },
      null,
      2,
    ),
  );

  if (!argv.includes("--apply")) {
    console.log("dry-run only — pass --apply with LEGACY_IMPORT_APPLY=YES to write");
    return;
  }

  const applied = await applyUpdates(databaseUrl, updates);
  console.log(JSON.stringify({ applied: true, updated: applied }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exitCode = 1;
});
