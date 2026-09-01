/** Fixed prefix for demo/figma seed entity IDs (`seedUuid` / figma catalog). */
export const DEMO_SEED_ENTITY_ID_PREFIX = "01900000-";

/** Deterministic UUIDv7-shaped IDs for idempotent seed upserts. */
export function seedUuid(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffffffff) {
    throw new Error(`seedUuid out of range: ${n}`);
  }

  return `${DEMO_SEED_ENTITY_ID_PREFIX}0000-7000-8000-${n.toString(16).padStart(12, "0")}`;
}

/**
 * Demo/figma seed entity IDs in this repo use the fixed `01900000-…` prefix
 * (`seedUuid` / figma catalog). Degusto migration IDs do not use this prefix.
 */
export function isDemoSeedEntityId(id: string): boolean {
  return id.startsWith(DEMO_SEED_ENTITY_ID_PREFIX);
}
