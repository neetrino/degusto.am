/**
 * PDP attribute groups (pass-through). Spicy / greens remain in the map for single-variant
 * products so the product page can show the configured level. For catalog filters, use
 * {@link productSupportsConfigurableSpicy} / {@link productSupportsConfigurableGreens}.
 */
export function filterFoodAttributeGroupsWithoutRealChoice<T>(
  groups: Map<string, T[]>
): Map<string, T[]> {
  return new Map(groups);
}
