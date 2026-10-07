export const PICKUP_BRANCH_IDS = [
  "paruyr-sevak-92",
  "bagratunyats-11a",
  "gai-avenue-17-3",
] as const;

export type PickupBranchId = (typeof PICKUP_BRANCH_IDS)[number];

/**
 * Pickup branches that accept card/wallet payment only (no cash).
 * Bagratunyats 11A and Gai Avenue 17/3.
 */
export const CARD_ONLY_PICKUP_BRANCH_IDS = [
  "bagratunyats-11a",
  "gai-avenue-17-3",
] as const satisfies readonly PickupBranchId[];

export type PickupBranchOption = {
  id: PickupBranchId;
  label: string;
};

export function isPickupBranchId(value: string): value is PickupBranchId {
  return (PICKUP_BRANCH_IDS as readonly string[]).includes(value);
}

/** True when the pickup branch does not accept cash payment. */
export function isCardOnlyPickupBranch(value: string): boolean {
  return (CARD_ONLY_PICKUP_BRANCH_IDS as readonly string[]).includes(value);
}

/** Resolves a pickup branch label from checkout locale options. */
export function resolvePickupBranchLabel(
  branchId: string,
  options: ReadonlyArray<PickupBranchOption>,
): string | null {
  if (!isPickupBranchId(branchId)) {
    return null;
  }
  return options.find((option) => option.id === branchId)?.label ?? null;
}
