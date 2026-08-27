import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

import { DUMP_TABLES, type DumpTable } from "./constants";
import { parseTuples } from "./parse-sql";

const INSERT_PREFIX = "INSERT INTO `";

function tableFromInsertLine(line: string): string | null {
  if (!line.startsWith(INSERT_PREFIX)) {
    return null;
  }
  const end = line.indexOf("`", INSERT_PREFIX.length);
  if (end === -1) {
    return null;
  }
  return line.slice(INSERT_PREFIX.length, end);
}

function isWanted(table: string): table is DumpTable {
  return (DUMP_TABLES as readonly string[]).includes(table);
}

function shouldStopCollecting(line: string): boolean {
  return line.startsWith("CREATE TABLE") || line.startsWith("ALTER TABLE");
}

export async function extractDumpInserts(
  dumpPath: string,
): Promise<Record<DumpTable, string>> {
  const buffers: Record<DumpTable, string[]> = {
    users: [],
    addresses: [],
    orders: [],
    order_products: [],
  };
  let current: DumpTable | null = null;
  const reader = createInterface({
    input: createReadStream(dumpPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of reader) {
    const insertTable = tableFromInsertLine(line);
    if (insertTable !== null) {
      current = isWanted(insertTable) ? insertTable : null;
      if (current) {
        buffers[current].push(line);
      }
      continue;
    }
    if (current === null) {
      continue;
    }
    if (shouldStopCollecting(line)) {
      current = null;
      continue;
    }
    buffers[current].push(line);
  }

  return {
    users: buffers.users.join("\n"),
    addresses: buffers.addresses.join("\n"),
    orders: buffers.orders.join("\n"),
    order_products: buffers.order_products.join("\n"),
  };
}

export async function parseDumpTables(
  dumpPath: string,
): Promise<Record<DumpTable, string[][]>> {
  const inserts = await extractDumpInserts(dumpPath);
  return {
    users: parseTuples(inserts.users),
    addresses: parseTuples(inserts.addresses),
    orders: parseTuples(inserts.orders),
    order_products: parseTuples(inserts.order_products),
  };
}
