import { createHash } from "node:crypto";

import { v5 as uuidv5 } from "uuid";

import {
  FALLBACK_FIRST_NAME,
  FALLBACK_LAST_NAME,
  GUEST_EMAIL_DOMAIN,
  LEGACY_UUID_NAMESPACE,
  ORDER_NUMBER_PREFIX,
} from "./constants";
import type {
  NeonProduct,
  OrderStatus,
  PaymentStatus,
  SkuMatch,
  UserRole,
} from "./types";

const ONLINE_METHODS = new Set(["idram", "inecobank", "FastShift"]);

export function mapRole(role: string): UserRole {
  return role === "admin" ? "ADMIN" : "CUSTOMER";
}

export function mapOrderStatus(
  method: string | null,
  status: string,
): { orderStatus: OrderStatus; paymentStatus: PaymentStatus } {
  if (status === "4") {
    return { orderStatus: "CANCELLED", paymentStatus: "CANCELLED" };
  }
  if (ONLINE_METHODS.has(method ?? "")) {
    if (status === "1") {
      return { orderStatus: "CONFIRMED", paymentStatus: "CAPTURED" };
    }
    return { orderStatus: "CANCELLED", paymentStatus: "FAILED" };
  }
  if (status === "1") {
    return { orderStatus: "CONFIRMED", paymentStatus: "PENDING" };
  }
  return { orderStatus: "PENDING", paymentStatus: "PENDING" };
}

export function mapPayment(method: string | null): {
  provider: string;
  method: string;
} {
  switch (method) {
    case "idram":
      return { provider: "idram", method: "idram" };
    case "inecobank":
      return { provider: "arca", method: "arca" };
    case "FastShift":
      return { provider: "fastshift", method: "fastshift" };
    case "cash":
      return { provider: "cod", method: "cash" };
    case null:
      return { provider: "cod", method: "cash" };
    default:
      return { provider: "unknown", method: method.toLowerCase() };
  }
}

export function guestEmail(oldId: number): string {
  return `guest-${oldId}@${GUEST_EMAIL_DOMAIN}`;
}

export function orderNumber(oldId: number): string {
  return `${ORDER_NUMBER_PREFIX}${oldId}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function displayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim() || "Customer";
}

export function nonEmptyName(
  value: string | null,
  fallback: string,
): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

export function firstNameOf(value: string | null): string {
  return nonEmptyName(value, FALLBACK_FIRST_NAME);
}

export function lastNameOf(value: string | null): string {
  return nonEmptyName(value, FALLBACK_LAST_NAME);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function orderIdempotency(oldId: number): {
  idempotencyScopeHash: string;
  idempotencyKeyHash: string;
  requestFingerprint: string;
} {
  return {
    idempotencyScopeHash: sha256Hex("legacy-import"),
    idempotencyKeyHash: sha256Hex(`order:${oldId}`),
    requestFingerprint: sha256Hex(`legacy:${oldId}`),
  };
}

export function legacyUuid(kind: string, oldId: number): string {
  return uuidv5(`legacy-${kind}:${oldId}`, LEGACY_UUID_NAMESPACE);
}

export function parseTimestamp(value: string | null, fallback: Date): Date {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed;
}

export function preferProductTitle(titleJson: string): string {
  try {
    const parsed: unknown = JSON.parse(titleJson);
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const en = readTitle(record.en);
      if (en) {
        return en;
      }
      const am = readTitle(record.am);
      if (am) {
        return am;
      }
      const ru = readTitle(record.ru);
      if (ru) {
        return ru;
      }
    }
  } catch {
    // keep raw snapshot
  }
  return titleJson.trim() || "Product";
}

function readTitle(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export type SkuResolve = { productId: string | null; match: SkuMatch };

export function resolveProductSku(
  code: string,
  oldProductId: number,
  products: ReadonlyArray<NeonProduct>,
): SkuResolve {
  const exact = products.find((product) => product.sku === code);
  if (exact) {
    return { productId: exact.id, match: "exact" };
  }
  const suffixSku = `${code}-${oldProductId}`;
  const suffix = products.find((product) => product.sku === suffixSku);
  if (suffix) {
    return { productId: suffix.id, match: "suffix" };
  }
  const prefix = `${code}-`;
  const prefixed = products
    .filter((product) => product.sku.startsWith(prefix))
    .sort((left, right) => left.sku.localeCompare(right.sku));
  const first = prefixed[0];
  if (first) {
    return { productId: first.id, match: "prefix" };
  }
  return { productId: null, match: "miss" };
}
