'use client';

import { useCallback } from 'react';
import { apiClient, ApiError } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import { emitCompareUpdated } from '../../lib/compare-api';
import { useCompareIdsContext } from '../../lib/compare/CompareIdsProvider';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Toggle compare membership for a product (guest + logged-in via compare API).
 * Reads shared ids from CompareIdsProvider — one bootstrap fetch, not per card.
 */
export function useCompare(productId: string) {
  const { t } = useTranslation();
  const { isInCompare, setProductInCompare } = useCompareIdsContext();

  const toggleCompare = useCallback(async () => {
    const previousState = isInCompare(productId);
    const nextState = !previousState;

    setProductInCompare(productId, nextState);

    try {
      if (nextState) {
        await apiClient.post('/api/v1/compare', { productId });
      } else {
        await apiClient.delete(`/api/v1/compare/${productId}`);
      }
      emitCompareUpdated();
    } catch (error) {
      setProductInCompare(productId, previousState);
      emitCompareUpdated();

      if (error instanceof ApiError && error.status === 422 && nextState) {
        alert(t('common.alerts.compareMaxReached'));
        return;
      }

      logger.error('Error syncing compare item', { error, productId });
    }
  }, [isInCompare, productId, setProductInCompare, t]);

  return {
    isInCompare: isInCompare(productId),
    toggleCompare,
  };
}
