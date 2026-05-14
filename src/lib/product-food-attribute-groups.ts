import { FOOD_ATTR_GREENS_KEY, FOOD_ATTR_SPICY_KEY } from './product-food-attributes';

/**
 * Removes spicy / greens selectors from PDP when the product does not expose
 * at least two distinct choices for that dimension.
 */
export function filterFoodAttributeGroupsWithoutRealChoice<T>(
  groups: Map<string, T[]>
): Map<string, T[]> {
  const next = new Map(groups);

  for (const key of [FOOD_ATTR_SPICY_KEY, FOOD_ATTR_GREENS_KEY]) {
    const list = next.get(key);
    if (Array.isArray(list) && list.length < 2) {
      next.delete(key);
    }
  }

  return next;
}
