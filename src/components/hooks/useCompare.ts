'use client';

import { useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import { emitCompareUpdated } from '../../lib/compare-api';
import { MAX_COMPARE_ITEMS } from '../../lib/compare/constants';
import { useCompareIdsContext } from '../../lib/compare/CompareIdsProvider';

/**
 * Hook for managing compare state for a product (persisted in database).
 */
export function useCompare(productId: string) {
  const { t } = useTranslation();
  const { isInCompare, setProductInCompare, compareCount } = useCompareIdsContext();
  const [pending, setPending] = useState(false);
  const isInCompareState = isInCompare(productId);

  const toggleCompare = async () => {
    if (pending) {
      return;
    }
    setPending(true);

    const previousState = isInCompareState;

    if (isInCompareState) {
      setProductInCompare(productId, false);
      emitCompareUpdated();
      try {
        await apiClient.delete(`/api/v1/compare/${productId}`);
      } catch (error) {
        setProductInCompare(productId, previousState);
        emitCompareUpdated();
        logger.error('Error removing compare item', { error, productId });
      } finally {
        setPending(false);
      }
      return;
    }

    if (compareCount >= MAX_COMPARE_ITEMS) {
      alert(t('common.alerts.compareMaxReached'));
      setPending(false);
      return;
    }

    setProductInCompare(productId, true);
    emitCompareUpdated();

    try {
      await apiClient.post('/api/v1/compare', { productId });
    } catch (error) {
      setProductInCompare(productId, previousState);
      emitCompareUpdated();
      logger.error('Error adding compare item', { error, productId });
    } finally {
      setPending(false);
    }
  };

  return { isInCompare: isInCompareState, toggleCompare };
}
