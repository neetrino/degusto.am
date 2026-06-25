/**
 * PDP attribute groups (pass-through).
 */
export function filterFoodAttributeGroupsWithoutRealChoice<T>(
  groups: Map<string, T[]>
): Map<string, T[]> {
  return new Map(groups);
}
