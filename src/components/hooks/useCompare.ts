'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import { emitCompareUpdated, fetchCompareIds } from '../../lib/compare-api';
import { MAX_COMPARE_ITEMS } from '../../lib/compare/constants';

/**
 * Hook for managing compare state for a product (persisted in database).
 */
export function useCompare(productId: string) {
  const { t } = useTranslation();
  const [isInCompare, setIsInCompare] = useState(false);

  const refreshFromServer = useCallback(async () => {
    const ids = await fetchCompareIds();
    setIsInCompare(ids.includes(productId));
  }, [productId]);

  useEffect(() => {
    void refreshFromServer();

    const handleCompareUpdate = () => {
      void refreshFromServer();
    };

    window.addEventListener('compare-updated', handleCompareUpdate);
    return () => {
      window.removeEventListener('compare-updated', handleCompareUpdate);
    };
  }, [refreshFromServer]);

  const toggleCompare = async () => {
    const previousState = isInCompare;

    if (isInCompare) {
      setIsInCompare(false);
      emitCompareUpdated();
      try {
        await apiClient.delete(`/api/v1/compare/${productId}`);
      } catch (error) {
        setIsInCompare(previousState);
        emitCompareUpdated();
        logger.error('Error removing compare item', { error, productId });
      }
      return;
    }

    const currentIds = await fetchCompareIds();
    if (currentIds.length >= MAX_COMPARE_ITEMS) {
      alert(t('common.alerts.compareMaxReached'));
      return;
    }

    setIsInCompare(true);
    emitCompareUpdated();

    try {
      await apiClient.post('/api/v1/compare', { productId });
    } catch (error) {
      setIsInCompare(previousState);
      emitCompareUpdated();
      logger.error('Error adding compare item', { error, productId });
    }
  };

  return { isInCompare, toggleCompare };
}
