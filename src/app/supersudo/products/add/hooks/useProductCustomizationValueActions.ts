'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/types';
import { showToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n-client';
import { logger } from '@/lib/utils/logger';
import { useAdminDialogs } from '../../../context/AdminDialogsContext';
import type { Attribute } from '../types';
import {
  ensureFormStateForAttribute,
  type PdpCustomizationFormState,
} from '../utils/pdp-customization-form';

type SetAttributes = React.Dispatch<React.SetStateAction<Attribute[]>>;
type FormStateUpdater = (
  updater: (prev: PdpCustomizationFormState) => PdpCustomizationFormState,
) => void;

interface UseProductCustomizationValueActionsProps {
  attributes: Attribute[];
  setAttributes: SetAttributes;
  onFormStateChange: FormStateUpdater;
}

function isDuplicateLabel(values: Attribute['values'], label: string): boolean {
  const normalized = label.toLowerCase().trim();
  return values.some((val) => val.label.toLowerCase().trim() === normalized);
}

export function useProductCustomizationValueActions({
  attributes,
  setAttributes,
  onFormStateChange,
}: UseProductCustomizationValueActionsProps) {
  const { t } = useTranslation();
  const { confirm: confirmDialog } = useAdminDialogs();
  const [draftLabels, setDraftLabels] = useState<Record<string, string>>({});
  const [valueErrors, setValueErrors] = useState<Record<string, string | null>>({});
  const [addingToAttributeId, setAddingToAttributeId] = useState<string | null>(null);
  const [deletingValueId, setDeletingValueId] = useState<string | null>(null);

  const setDraftLabel = useCallback((attributeId: string, label: string) => {
    setDraftLabels((prev) => ({ ...prev, [attributeId]: label }));
    setValueErrors((prev) => (prev[attributeId] ? { ...prev, [attributeId]: null } : prev));
  }, []);

  const handleAddValue = useCallback(
    async (attributeId: string) => {
      const trimmedValue = (draftLabels[attributeId] ?? '').trim();
      const attribute = attributes.find((attr) => attr.id === attributeId);

      if (!trimmedValue) {
        const message = t('admin.attributes.enterValue');
        showToast(message, 'warning');
        setValueErrors((prev) => ({ ...prev, [attributeId]: message }));
        return;
      }

      if (!attribute) {
        showToast(t('admin.attributes.attributeNotFound'), 'error');
        return;
      }

      if (isDuplicateLabel(attribute.values, trimmedValue)) {
        const message = t('admin.attributes.valueAlreadyExists').replace('{value}', trimmedValue);
        showToast(message, 'error', 5000);
        setValueErrors((prev) => ({ ...prev, [attributeId]: message }));
        return;
      }

      try {
        setAddingToAttributeId(attributeId);
        setValueErrors((prev) => ({ ...prev, [attributeId]: null }));
        const response = await apiClient.post<{ data: Attribute }>(
          `/api/v1/admin/attributes/${attributeId}/values`,
          { label: trimmedValue, locale: 'en', priceAdjustment: 0 },
        );

        if (response.data) {
          setAttributes((prev) =>
            prev.map((attr) => (attr.id === attributeId ? response.data : attr)),
          );
          onFormStateChange((prev) => ensureFormStateForAttribute(prev, response.data));
          setDraftLabels((prev) => ({ ...prev, [attributeId]: '' }));
          showToast(t('admin.attributes.valueAddedSuccess'), 'success');
        }
      } catch (err: unknown) {
        logger.error('[ADMIN] Failed to add customization value', err);
        let message = t('admin.attributes.failedToAddValue');
        if (err instanceof ApiError) {
          const detail =
            err.data && typeof err.data === 'object' && 'detail' in err.data
              ? String(err.data.detail)
              : err.message;
          if (detail) {
            message = detail;
          }
        } else if (err instanceof Error && err.message) {
          message = err.message;
        }
        if (message.includes('already exists') || message.includes('уже существует')) {
          message = t('admin.attributes.valueAlreadyExists').replace('{value}', trimmedValue);
        }
        showToast(message, 'error', 5000);
        setValueErrors((prev) => ({ ...prev, [attributeId]: message }));
      } finally {
        setAddingToAttributeId(null);
      }
    },
    [attributes, draftLabels, onFormStateChange, setAttributes, t],
  );

  const handleDeleteValue = useCallback(
    async (attributeId: string, valueId: string, valueLabel: string) => {
      const isConfirmed = await confirmDialog({
        title: t('admin.common.delete'),
        message: t('admin.attributes.deleteValueConfirm').replace('{label}', valueLabel),
        confirmText: t('admin.common.delete'),
        destructive: true,
      });
      if (!isConfirmed) {
        return;
      }

      try {
        setDeletingValueId(valueId);
        await apiClient.delete(`/api/v1/admin/attributes/${attributeId}/values/${valueId}`);
        setAttributes((prev) =>
          prev.map((attr) =>
            attr.id === attributeId
              ? { ...attr, values: attr.values.filter((value) => value.id !== valueId) }
              : attr,
          ),
        );
        onFormStateChange((prev) => {
          const next = { ...prev };
          delete next[valueId];
          return next;
        });
        showToast(t('admin.attributes.valueDeletedSuccess'), 'success');
      } catch (err: unknown) {
        logger.error('[ADMIN] Failed to delete customization value', err);
        let message = 'Failed to delete value';
        if (err instanceof ApiError) {
          const detail =
            err.data && typeof err.data === 'object' && 'detail' in err.data
              ? String(err.data.detail)
              : err.message;
          if (detail) {
            message = detail;
          }
        } else if (err instanceof Error && err.message) {
          message = err.message;
        }
        showToast(t('admin.attributes.errorDeletingValue').replace('{message}', message), 'error');
      } finally {
        setDeletingValueId(null);
      }
    },
    [confirmDialog, onFormStateChange, setAttributes, t],
  );

  return {
    getDraftLabel: (attributeId: string) => draftLabels[attributeId] ?? '',
    getValueError: (attributeId: string) => valueErrors[attributeId] ?? null,
    addingToAttributeId,
    deletingValueId,
    setDraftLabel,
    handleAddValue,
    handleDeleteValue,
  };
}
