import { useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { showToast } from '../../../../components/Toast';
import { useTranslation } from '../../../../lib/i18n-client';

/** Wait for the user to finish dragging before persisting (avoids one request per pixel). */
const REORDER_SAVE_DEBOUNCE_MS = 300;

interface ReorderPayload {
  parentId: string | null;
  orderedIds: string[];
}

interface UseCategoryReorderSaveProps {
  onReorderApplied: (parentId: string | null, orderedIds: string[]) => void;
  onReorderFailed: () => Promise<void>;
}

/**
 * Optimistic category reorder with debounced background persistence.
 */
export function useCategoryReorderSave({
  onReorderApplied,
  onReorderFailed,
}: UseCategoryReorderSaveProps) {
  const { t } = useTranslation();
  const latestPayloadRef = useRef<ReorderPayload | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const persistLatest = useCallback(async () => {
    if (savingRef.current) {
      return;
    }

    savingRef.current = true;
    try {
      while (latestPayloadRef.current) {
        const payload = latestPayloadRef.current;
        latestPayloadRef.current = null;

        try {
          await apiClient.patch('/api/v1/admin/categories/reorder', {
            parentId: payload.parentId,
            orderedIds: payload.orderedIds,
          });
        } catch (error: unknown) {
          logger.error('Category reorder failed', { error });
          await onReorderFailed();
          showToast(t('admin.categories.reorderError'), 'error');
          return;
        }
      }
    } finally {
      savingRef.current = false;
      if (latestPayloadRef.current) {
        void persistLatest();
      }
    }
  }, [onReorderFailed, t]);

  const scheduleReorderSave = useCallback(
    (parentId: string | null, orderedIds: string[]) => {
      onReorderApplied(parentId, orderedIds);
      latestPayloadRef.current = { parentId, orderedIds };

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void persistLatest();
      }, REORDER_SAVE_DEBOUNCE_MS);
    },
    [onReorderApplied, persistLatest],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (latestPayloadRef.current) {
        void persistLatest();
      }
    };
  }, [persistLatest]);

  return { scheduleReorderSave };
}
