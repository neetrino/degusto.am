import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import {
  addresses,
  orderEvents,
  orderItems,
  orders,
  payments,
  users,
} from "@/db/schema";

import {
  APPLY_ENV_NAME,
  APPLY_ENV_VALUE,
  BATCH_ADDRESSES,
  BATCH_CHILDREN,
  BATCH_ORDERS,
  BATCH_USERS,
  DEFAULT_COUNTRY,
  DEFAULT_LOCALE,
} from "./constants";
import type { ImportPlan, PlannedAddress, PlannedOrder, PlannedUser } from "./types";

function assertApplyAllowed(): void {
  if (process.env[APPLY_ENV_NAME] !== APPLY_ENV_VALUE) {
    throw new Error(
      `Refusing apply: ${APPLY_ENV_NAME} must be ${APPLY_ENV_VALUE}`,
    );
  }
}

async function insertChunks<T>(
  items: readonly T[],
  size: number,
  write: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let index = 0; index < items.length; index += size) {
    const chunk = items.slice(index, index + size);
    if (chunk.length === 0) {
      continue;
    }
    await write(chunk);
  }
}

function userValues(user: PlannedUser) {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    passwordUpdatedAt: user.passwordUpdatedAt,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    status: "ACTIVE" as const,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  };
}

function addressValues(address: PlannedAddress) {
  if (!address.userId) {
    throw new Error(`Address ${address.oldId} missing user`);
  }
  return {
    id: address.id,
    userId: address.userId,
    recipientFirstName: address.recipientFirstName,
    recipientLastName: address.recipientLastName,
    phone: address.phone,
    countryCode: DEFAULT_COUNTRY,
    city: address.city,
    line1: address.line1,
    isDefaultShipping: address.isDefaultShipping,
    isDefaultBilling: address.isDefaultBilling,
    createdAt: address.createdAt,
    updatedAt: address.createdAt,
  };
}

function orderValues(order: PlannedOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    contactEmail: order.contactEmail,
    contactPhone: order.contactPhone,
    contactName: order.contactName,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotalAmount: order.totalAmount,
    discountAmount: 0,
    taxAmount: 0,
    deliveryAmount: 0,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    idempotencyScopeHash: order.idempotencyScopeHash,
    idempotencyKeyHash: order.idempotencyKeyHash,
    requestFingerprint: order.requestFingerprint,
    locale: DEFAULT_LOCALE,
    placedAt: order.placedAt,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
  };
}

function itemValues(item: ImportPlan["items"][number]) {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    productTitleSnapshot: item.productTitleSnapshot,
    productSkuSnapshot: item.productSkuSnapshot,
    quantity: item.quantity,
    unitBaseAmount: item.unitAmount,
    unitDisplayAmount: item.unitAmount,
    lineTotalAmount: item.lineTotalAmount,
  };
}

function paymentValues(payment: ImportPlan["payments"][number]) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    method: payment.method,
    amount: payment.amount,
    status: payment.status,
    attemptNumber: 1,
    metadata: { source: "legacy-import" },
  };
}

function eventValues(event: ImportPlan["events"][number]) {
  return {
    id: event.id,
    orderId: event.orderId,
    eventType: "NOTE" as const,
    isCustomerVisible: false,
    payload: event.payload,
  };
}

export async function applyPlan(
  databaseUrl: string,
  plan: ImportPlan,
): Promise<{ inserted: Record<string, number> }> {
  assertApplyAllowed();
  const db = drizzle(neon(databaseUrl));
  const newUsers = plan.users.filter((user) => user.action === "insert");
  const newAddresses = plan.addresses.filter(
    (address) => address.action === "insert" && address.userId,
  );
  const newOrders = plan.orders.filter((order) => order.action === "insert");

  await insertChunks(newUsers, BATCH_USERS, (chunk) =>
    db.insert(users).values(chunk.map(userValues)).onConflictDoNothing(),
  );
  await insertChunks(newAddresses, BATCH_ADDRESSES, (chunk) =>
    db.insert(addresses).values(chunk.map(addressValues)).onConflictDoNothing(),
  );
  await insertChunks(newOrders, BATCH_ORDERS, (chunk) =>
    db.insert(orders).values(chunk.map(orderValues)).onConflictDoNothing(),
  );
  await insertChunks(plan.items, BATCH_CHILDREN, (chunk) =>
    db.insert(orderItems).values(chunk.map(itemValues)).onConflictDoNothing(),
  );
  await insertChunks(plan.payments, BATCH_CHILDREN, (chunk) =>
    db.insert(payments).values(chunk.map(paymentValues)).onConflictDoNothing(),
  );
  await insertChunks(plan.events, BATCH_CHILDREN, (chunk) =>
    db
      .insert(orderEvents)
      .values(chunk.map(eventValues))
      .onConflictDoNothing(),
  );

  return {
    inserted: {
      users: newUsers.length,
      addresses: newAddresses.length,
      orders: newOrders.length,
      items: plan.items.length,
      payments: plan.payments.length,
      events: plan.events.length,
    },
  };
}
