import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import type { AttributeValuePricePatch } from './pdp-customization-form';

export async function syncAttributeValuePricePatches(
  patches: AttributeValuePricePatch[],
): Promise<void> {
  for (const patch of patches) {
    await apiClient.patch(
      `/api/v1/admin/attributes/${patch.attributeId}/values/${patch.valueId}`,
      { priceAdjustment: patch.priceAdjustment },
    );
    logger.debug('Updated attribute value priceAdjustment', {
      valueId: patch.valueId,
      priceAdjustment: patch.priceAdjustment,
    });
  }
}
