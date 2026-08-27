import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PROTECTED_EMAILS } from "./constants";
import type {
  ImportPlan,
  NeonSnapshot,
  PlannedItem,
  PlannedOrder,
} from "./types";

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const name = key(item);
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function uniqueMisses(items: PlannedItem[]): Array<{
  code: string;
  oldProductId: number;
  title: string;
}> {
  const seen = new Map<string, { code: string; oldProductId: number; title: string }>();
  for (const item of items) {
    if (item.match !== "miss") {
      continue;
    }
    const key = `${item.productSkuSnapshot}:${item.oldProductId}`;
    if (!seen.has(key)) {
      seen.set(key, {
        code: item.productSkuSnapshot,
        oldProductId: item.oldProductId,
        title: item.productTitleSnapshot,
      });
    }
  }
  return [...seen.values()].sort((a, b) => a.oldProductId - b.oldProductId);
}

function usersSection(plan: ImportPlan, snapshot: NeonSnapshot) {
  const skipUsers = plan.users.filter((user) => user.action === "skip_email");
  const skipExisting = skipUsers.filter((user) =>
    snapshot.usersByEmail.has(user.email),
  );
  return {
    dump: plan.users.length,
    insert: plan.users.filter((user) => user.action === "insert").length,
    skipExistingEmail: skipExisting.length,
    skipDumpDuplicateEmail: skipUsers.length - skipExisting.length,
    skippedEmails: [...new Set(skipUsers.map((user) => user.email))],
    roles: countBy(plan.users, (user) => user.role),
    collisionEmails: skipExisting.map((user) => user.email),
  };
}

function addressesSection(plan: ImportPlan) {
  return {
    dump: plan.addresses.length,
    insert: plan.addresses.filter((row) => row.action === "insert").length,
    skipMissingUser: plan.addresses.filter(
      (row) => row.action === "skip_missing_user",
    ).length,
    skipExisting: plan.addresses.filter((row) => row.action === "skip_existing")
      .length,
  };
}

function ordersSection(insertOrders: PlannedOrder[], dumpCount: number) {
  return {
    dump: dumpCount,
    insert: insertOrders.length,
    skipExistingNumber: dumpCount - insertOrders.length,
    guest: insertOrders.filter((order) => order.kind === "guest").length,
    registered: insertOrders.filter((order) => order.kind === "registered")
      .length,
  };
}

export function buildReport(
  plan: ImportPlan,
  snapshot: NeonSnapshot,
  dumpPath: string,
): Record<string, unknown> {
  const users = usersSection(plan, snapshot);
  const insertOrders = plan.orders.filter((order) => order.action === "insert");
  const skuMisses = uniqueMisses(plan.items);
  return {
    mode: "dry-run",
    writeToNeon: false,
    dump: dumpPath,
    neonHost: snapshot.host,
    users,
    addresses: addressesSection(plan),
    orders: ordersSection(insertOrders, plan.orders.length),
    items: {
      dumpLinked: plan.items.length,
      skuExact: plan.items.filter((item) => item.match === "exact").length,
      skuSuffix: plan.items.filter((item) => item.match === "suffix").length,
      skuPrefix: plan.items.filter((item) => item.match === "prefix").length,
      skuMiss: plan.items.filter((item) => item.match === "miss").length,
      uniqueMissCodes: skuMisses,
    },
    payments: {
      byOldMethod: countBy(
        insertOrders,
        (order) => order.oldPaymentMethod ?? "null",
      ),
      byProvider: countBy(plan.payments, (payment) => payment.provider),
    },
    risks: {
      protectedEmailsUntouched: [...PROTECTED_EMAILS],
      emailCollisions: users.collisionEmails,
      missingProductCodes: skuMisses.length,
      couponUnused:
        "Old dump has no coupons/promotions table; Neon promotions are left as-is",
      catalogUntouched: true,
      existingUsersUntouched: true,
    },
  };
}

export function writeReport(
  reportPath: string,
  report: Record<string, unknown>,
): void {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export function printCounts(report: Record<string, unknown>): void {
  const users = report.users as Record<string, unknown>;
  const addresses = report.addresses as Record<string, unknown>;
  const orders = report.orders as Record<string, unknown>;
  const items = report.items as Record<string, unknown>;
  const payments = report.payments as Record<string, unknown>;
  console.log(
    JSON.stringify(
      {
        writeToNeon: report.writeToNeon,
        users: {
          insert: users.insert,
          skipExistingEmail: users.skipExistingEmail,
          skipDumpDuplicateEmail: users.skipDumpDuplicateEmail,
        },
        addresses: {
          insert: addresses.insert,
          skipMissingUser: addresses.skipMissingUser,
        },
        orders: {
          insert: orders.insert,
          guest: orders.guest,
          registered: orders.registered,
          skipExistingNumber: orders.skipExistingNumber,
        },
        items: {
          skuExact: items.skuExact,
          skuSuffix: items.skuSuffix,
          skuPrefix: items.skuPrefix,
          skuMiss: items.skuMiss,
          uniqueMissCodes: (items.uniqueMissCodes as unknown[]).length,
        },
        paymentsByMethod: payments.byOldMethod,
      },
      null,
      2,
    ),
  );
}
