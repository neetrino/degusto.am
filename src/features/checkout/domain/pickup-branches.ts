export const PICKUP_BRANCH_IDS = [
  "paruyr-sevak-92",
  "bagratunyats-11a",
] as const;

export type PickupBranchId = (typeof PICKUP_BRANCH_IDS)[number];

export type PickupBranchOption = {
  id: PickupBranchId;
  label: string;
};

export function isPickupBranchId(value: string): value is PickupBranchId {
  return (PICKUP_BRANCH_IDS as readonly string[]).includes(value);
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
