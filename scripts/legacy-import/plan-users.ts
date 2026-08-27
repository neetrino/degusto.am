import { DEFAULT_CITY, UNKNOWN_PHONE } from "./constants";
import {
  firstNameOf,
  lastNameOf,
  legacyUuid,
  mapRole,
  normalizeEmail,
  parseTimestamp,
} from "./mappers";
import { sqlInt, sqlValue } from "./parse-sql";
import type {
  DumpAddress,
  DumpOrder,
  DumpOrderItem,
  DumpUser,
  NeonSnapshot,
  PlannedAddress,
  PlannedUser,
} from "./types";

const FALLBACK_PLACEHOLDER = "-";

export function parseDumpUser(row: string[]): DumpUser {
  return {
    oldId: sqlInt(row[0] ?? "0"),
    firstName: firstNameOf(sqlValue(row[1] ?? "NULL")),
    lastName: lastNameOf(sqlValue(row[2] ?? "NULL")),
    phone: sqlValue(row[3] ?? "NULL"),
    email: normalizeEmail(sqlValue(row[4] ?? "") ?? ""),
    oldRole: sqlValue(row[5] ?? "NULL") ?? "user",
    passwordHash: sqlValue(row[7] ?? "") ?? "",
    createdAt: sqlValue(row[9] ?? "NULL"),
    updatedAt: sqlValue(row[10] ?? "NULL"),
  };
}

export function parseDumpAddress(row: string[]): DumpAddress {
  return {
    oldId: sqlInt(row[0] ?? "0"),
    oldUserId: sqlInt(row[1] ?? "0"),
    active: sqlInt(row[2] ?? "0"),
    line1: sqlValue(row[3] ?? "NULL") ?? "-",
    createdAt: sqlValue(row[4] ?? "NULL"),
    updatedAt: sqlValue(row[5] ?? "NULL"),
  };
}

export function parseDumpOrder(row: string[]): DumpOrder {
  const oldUser = sqlValue(row[1] ?? "NULL");
  return {
    oldId: sqlInt(row[0] ?? "0"),
    oldUserId: oldUser ? sqlInt(oldUser) : null,
    city: sqlValue(row[2] ?? "NULL"),
    line1: sqlValue(row[3] ?? "NULL"),
    phone: sqlValue(row[4] ?? "NULL"),
    slotDate: sqlValue(row[5] ?? "NULL"),
    slotTime: sqlValue(row[6] ?? "NULL"),
    comment: sqlValue(row[7] ?? "NULL"),
    totalAmount: sqlInt(row[8] ?? "0"),
    status: row[9] ?? "0",
    createdAt: sqlValue(row[10] ?? "NULL"),
    paymentMethod: sqlValue(row[12] ?? "NULL") || null,
  };
}

export function parseDumpItem(row: string[]): DumpOrderItem {
  return {
    oldId: sqlInt(row[0] ?? "0"),
    oldOrderId: sqlInt(row[1] ?? "0"),
    oldProductId: sqlInt(row[2] ?? "0"),
    titleJson: sqlValue(row[3] ?? "NULL") ?? "",
    quantity: sqlInt(row[4] ?? "1"),
    code: sqlValue(row[5] ?? "NULL") ?? "",
    unitPrice: sqlInt(row[10] ?? "0"),
  };
}

export function planUsers(
  dumpUsers: DumpUser[],
  snapshot: NeonSnapshot,
  now: Date,
): { planned: PlannedUser[]; uuidByOldId: Map<number, string> } {
  const uuidByOldId = new Map<number, string>();
  const dumpEmailOwner = new Map<string, string>();
  const planned: PlannedUser[] = [];

  for (const user of dumpUsers) {
    if (!user.email) {
      continue;
    }
    const existing = snapshot.usersByEmail.get(user.email);
    const dumpOwner = dumpEmailOwner.get(user.email);
    const createdAt = parseTimestamp(user.createdAt, now);
    const id =
      existing ?? dumpOwner ?? legacyUuid("user", user.oldId);
    uuidByOldId.set(user.oldId, id);
    if (!dumpOwner) {
      dumpEmailOwner.set(user.email, id);
    }
    planned.push({
      action: existing || dumpOwner ? "skip_email" : "insert",
      oldId: user.oldId,
      id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: mapRole(user.oldRole),
      passwordHash: user.passwordHash,
      createdAt,
      passwordUpdatedAt: createdAt,
    });
  }

  return { planned, uuidByOldId };
}

function pickDefaultOldId(rows: DumpAddress[]): number | null {
  const active = rows.find((row) => row.active === 1);
  return active?.oldId ?? rows[0]?.oldId ?? null;
}

export function planAddresses(
  dumpAddresses: DumpAddress[],
  dumpUsers: DumpUser[],
  uuidByOldId: Map<number, string>,
  snapshot: NeonSnapshot,
  now: Date,
): PlannedAddress[] {
  const userByOldId = new Map(dumpUsers.map((user) => [user.oldId, user]));
  const byNeonUser = new Map<string, DumpAddress[]>();
  for (const address of dumpAddresses) {
    const userId = uuidByOldId.get(address.oldUserId);
    if (!userId) {
      continue;
    }
    const list = byNeonUser.get(userId) ?? [];
    list.push(address);
    byNeonUser.set(userId, list);
  }
  const defaultIds = new Set<number>();
  for (const [userId, rows] of byNeonUser) {
    if (snapshot.userIds.has(userId)) {
      continue;
    }
    const id = pickDefaultOldId(rows);
    if (id !== null) {
      defaultIds.add(id);
    }
  }

  return dumpAddresses.map((address) =>
    mapAddress(address, userByOldId, uuidByOldId, snapshot, defaultIds, now),
  );
}

function mapAddress(
  address: DumpAddress,
  userByOldId: Map<number, DumpUser>,
  uuidByOldId: Map<number, string>,
  snapshot: NeonSnapshot,
  defaultIds: Set<number>,
  now: Date,
): PlannedAddress {
  const user = userByOldId.get(address.oldUserId);
  const userId = uuidByOldId.get(address.oldUserId) ?? null;
  const id = legacyUuid("address", address.oldId);
  if (!user || !userId) {
    return emptySkippedAddress(address, id, now);
  }
  const isDefault = defaultIds.has(address.oldId);
  return {
    action: snapshot.addressIds.has(id) ? "skip_existing" : "insert",
    oldId: address.oldId,
    id,
    userId,
    recipientFirstName: user.firstName,
    recipientLastName: user.lastName,
    phone: user.phone?.trim() || UNKNOWN_PHONE,
    city: DEFAULT_CITY,
    line1: address.line1.trim() || "-",
    isDefaultShipping: isDefault,
    isDefaultBilling: isDefault,
    createdAt: parseTimestamp(address.createdAt, now),
  };
}

function emptySkippedAddress(
  address: DumpAddress,
  id: string,
  now: Date,
): PlannedAddress {
  return {
    action: "skip_missing_user",
    oldId: address.oldId,
    id,
    userId: null,
    recipientFirstName: FALLBACK_PLACEHOLDER,
    recipientLastName: FALLBACK_PLACEHOLDER,
    phone: UNKNOWN_PHONE,
    city: DEFAULT_CITY,
    line1: address.line1,
    isDefaultShipping: false,
    isDefaultBilling: false,
    createdAt: parseTimestamp(address.createdAt, now),
  };
}
