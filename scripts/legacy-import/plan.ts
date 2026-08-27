import { parseDumpTables } from "./parse-dump";
import {
  parseDumpAddress,
  parseDumpItem,
  parseDumpOrder,
  parseDumpUser,
  planAddresses,
  planUsers,
} from "./plan-users";
import {
  assemblePlan,
  planEvents,
  planItems,
  planOrders,
  planPayments,
} from "./plan-orders";
import type { ImportPlan, NeonSnapshot } from "./types";

export async function buildImportPlan(
  dumpPath: string,
  snapshot: NeonSnapshot,
  now = new Date(),
): Promise<ImportPlan> {
  const tables = await parseDumpTables(dumpPath);
  const dumpUsers = tables.users.map(parseDumpUser);
  const dumpAddresses = tables.addresses.map(parseDumpAddress);
  const dumpOrders = tables.orders.map(parseDumpOrder);
  const dumpItems = tables.order_products.map(parseDumpItem);

  const { planned: users, uuidByOldId } = planUsers(
    dumpUsers,
    snapshot,
    now,
  );
  const addresses = planAddresses(
    dumpAddresses,
    dumpUsers,
    uuidByOldId,
    snapshot,
    now,
  );
  const orders = planOrders(
    dumpOrders,
    dumpUsers,
    uuidByOldId,
    snapshot,
    now,
  );
  const ordersByOldId = new Map(orders.map((order) => [order.oldId, order]));
  const items = planItems(dumpItems, ordersByOldId, snapshot);
  const payments = planPayments(orders);
  const events = planEvents(orders);
  return assemblePlan(users, addresses, orders, items, payments, events);
}
