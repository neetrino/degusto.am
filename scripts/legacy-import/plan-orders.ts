import { DEFAULT_CITY, DEFAULT_COUNTRY, UNKNOWN_PHONE } from "./constants";
import {
  displayName,
  guestEmail,
  legacyUuid,
  mapOrderStatus,
  mapPayment,
  orderIdempotency,
  orderNumber,
  parseTimestamp,
  preferProductTitle,
  resolveProductSku,
} from "./mappers";
import type {
  DumpOrder,
  DumpOrderItem,
  DumpUser,
  ImportPlan,
  NeonSnapshot,
  PlannedEvent,
  PlannedItem,
  PlannedOrder,
  PlannedPayment,
  PlannedUser,
  PlannedAddress,
} from "./types";

function contactForOrder(
  order: DumpOrder,
  user: DumpUser | undefined,
  userId: string | null,
): {
  kind: "guest" | "registered";
  userId: string | null;
  contactEmail: string;
  contactName: string;
  firstName: string;
  lastName: string;
} {
  if (order.oldUserId !== null && user && userId) {
    return {
      kind: "registered",
      userId,
      contactEmail: user.email,
      contactName: displayName(user.firstName, user.lastName),
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
  return {
    kind: "guest",
    userId: null,
    contactEmail: guestEmail(order.oldId),
    contactName: "Guest",
    firstName: "Guest",
    lastName: "-",
  };
}

function shippingOf(
  contact: {
    firstName: string;
    lastName: string;
  },
  order: DumpOrder,
) {
  return {
    recipientFirstName: contact.firstName,
    recipientLastName: contact.lastName,
    phone: order.phone?.trim() || UNKNOWN_PHONE,
    countryCode: DEFAULT_COUNTRY,
    city: order.city?.trim() || DEFAULT_CITY,
    line1: order.line1?.trim() || "-",
  };
}

export function planOrders(
  dumpOrders: DumpOrder[],
  dumpUsers: DumpUser[],
  uuidByOldId: Map<number, string>,
  snapshot: NeonSnapshot,
  now: Date,
): PlannedOrder[] {
  const userByOldId = new Map(dumpUsers.map((user) => [user.oldId, user]));
  return dumpOrders.map((order) => {
    const user =
      order.oldUserId !== null ? userByOldId.get(order.oldUserId) : undefined;
    const mappedUserId =
      order.oldUserId !== null
        ? (uuidByOldId.get(order.oldUserId) ?? null)
        : null;
    const contact = contactForOrder(order, user, mappedUserId);
    const statuses = mapOrderStatus(order.paymentMethod, order.status);
    const payment = mapPayment(order.paymentMethod);
    const placedAt = parseTimestamp(order.createdAt, now);
    const number = orderNumber(order.oldId);
    const address = shippingOf(contact, order);
    return {
      action: snapshot.orderNumbers.has(number) ? "skip_existing" : "insert",
      oldId: order.oldId,
      id: legacyUuid("order", order.oldId),
      orderNumber: number,
      kind: contact.kind,
      userId: contact.userId,
      contactEmail: contact.contactEmail,
      contactPhone: order.phone?.trim() || UNKNOWN_PHONE,
      contactName: contact.contactName,
      status: statuses.orderStatus,
      paymentStatus: statuses.paymentStatus,
      totalAmount: order.totalAmount,
      shippingAddress: address,
      billingAddress: address,
      ...orderIdempotency(order.oldId),
      placedAt,
      createdAt: placedAt,
      comment: order.comment,
      slotDate: order.slotDate,
      slotTime: order.slotTime,
      paymentProvider: payment.provider,
      paymentMethod: payment.method,
      oldPaymentMethod: order.paymentMethod,
    };
  });
}

export function planItems(
  dumpItems: DumpOrderItem[],
  ordersByOldId: Map<number, PlannedOrder>,
  snapshot: NeonSnapshot,
): PlannedItem[] {
  const items: PlannedItem[] = [];
  for (const item of dumpItems) {
    const order = ordersByOldId.get(item.oldOrderId);
    if (!order || order.action !== "insert" || item.quantity < 1) {
      continue;
    }
    const resolved = resolveProductSku(
      item.code,
      item.oldProductId,
      snapshot.products,
    );
    items.push({
      oldId: item.oldId,
      oldProductId: item.oldProductId,
      id: legacyUuid("order-item", item.oldId),
      orderId: order.id,
      productId: resolved.productId,
      productTitleSnapshot: preferProductTitle(item.titleJson),
      productSkuSnapshot: item.code,
      quantity: item.quantity,
      unitAmount: item.unitPrice,
      lineTotalAmount: item.unitPrice * item.quantity,
      match: resolved.match,
    });
  }
  return items;
}

export function planPayments(orders: PlannedOrder[]): PlannedPayment[] {
  return orders
    .filter((order) => order.action === "insert")
    .map((order) => ({
      id: legacyUuid("payment", order.oldId),
      orderId: order.id,
      provider: order.paymentProvider,
      method: order.paymentMethod,
      amount: order.totalAmount,
      status: order.paymentStatus,
    }));
}

export function planEvents(orders: PlannedOrder[]): PlannedEvent[] {
  return orders
    .filter((order) => order.action === "insert")
    .map((order) => ({
      id: legacyUuid("order-event", order.oldId),
      orderId: order.id,
      payload: {
        source: "legacy-import",
        comment: order.comment,
        date: order.slotDate,
        time: order.slotTime,
      },
    }));
}

export function assemblePlan(
  users: PlannedUser[],
  addresses: PlannedAddress[],
  orders: PlannedOrder[],
  items: PlannedItem[],
  payments: PlannedPayment[],
  events: PlannedEvent[],
): ImportPlan {
  return { users, addresses, orders, items, payments, events };
}
