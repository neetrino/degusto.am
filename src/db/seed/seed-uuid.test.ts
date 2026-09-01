import { describe, expect, it } from "vitest";

import {
  DEMO_SEED_ENTITY_ID_PREFIX,
  isDemoSeedEntityId,
  seedUuid,
} from "@/db/seed/seed-uuid";

describe("isDemoSeedEntityId", () => {
  it("recognizes figma/demo seed UUID prefix", () => {
    expect(isDemoSeedEntityId(seedUuid(110))).toBe(true);
    expect(isDemoSeedEntityId("01900000-0000-7000-8000-000000000119")).toBe(
      true,
    );
    expect(
      isDemoSeedEntityId("01900000-0000-7000-9000-000000300001"),
    ).toBe(true);
    expect(seedUuid(110).startsWith(DEMO_SEED_ENTITY_ID_PREFIX)).toBe(true);
  });

  it("rejects Degusto-style non-seed ids", () => {
    expect(isDemoSeedEntityId("310e04d7-d4aa-5a3e-a935-b27990445722")).toBe(
      false,
    );
    expect(isDemoSeedEntityId("4e629fcf-893f-5d6a-b69b-cac9eb36fcb5")).toBe(
      false,
    );
  });
});
