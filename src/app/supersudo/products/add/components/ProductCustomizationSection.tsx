'use client';

import { useEffect, useMemo } from 'react';
import {
  filterAdminProductFormCustomizationAttributes,
  getPdpCustomizationLayoutColumn,
} from '@/lib/products/pdp-customization-config';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { Attribute } from '../types';
import {
  ensureFormStateForAttribute,
  getSelectedCustomizationAttributes,
  type PdpCustomizationFormState,
} from '../utils/pdp-customization-form';
import { useProductCustomizationValueActions } from '../hooks/useProductCustomizationValueActions';
import { ProductCustomizationAttributeCard } from './ProductCustomizationAttributeCard';

interface ProductCustomizationSectionProps {
  attributes: Attribute[];
  setAttributes: React.Dispatch<React.SetStateAction<Attribute[]>>;
  selectedAttributeIds: Set<string>;
  onSelectedAttributeIdsChange: (updater: (prev: Set<string>) => Set<string>) => void;
  formState: PdpCustomizationFormState;
  onFormStateChange: (updater: (prev: PdpCustomizationFormState) => PdpCustomizationFormState) => void;
}

function groupAttributesByLayoutColumn(attributes: Attribute[]) {
  const addition: Attribute[] = [];
  const exclusion: Attribute[] = [];

  for (const attribute of attributes) {
    const column = getPdpCustomizationLayoutColumn(attribute.key);
    if (column === 'addition') {
      addition.push(attribute);
    } else if (column === 'exclusion') {
      exclusion.push(attribute);
    }
  }

  return { addition, exclusion };
}

export function ProductCustomizationSection({
  attributes,
  setAttributes,
  selectedAttributeIds,
  onSelectedAttributeIdsChange,
  formState,
  onFormStateChange,
}: ProductCustomizationSectionProps) {
  const { t } = useTranslation();
  const exclusionValueActions = useProductCustomizationValueActions({
    attributes,
    setAttributes,
    onFormStateChange,
  });

  const customizationAttributes = useMemo(
    () => filterAdminProductFormCustomizationAttributes(attributes),
    [attributes],
  );

  const selectedAttributes = useMemo(
    () => getSelectedCustomizationAttributes(customizationAttributes, selectedAttributeIds),
    [customizationAttributes, selectedAttributeIds],
  );

  const { addition, exclusion } = useMemo(
    () => groupAttributesByLayoutColumn(selectedAttributes),
    [selectedAttributes],
  );

  const showSideBySide = addition.length > 0 && exclusion.length > 0;

  useEffect(() => {
    if (customizationAttributes.length === 0) {
      return;
    }

    onSelectedAttributeIdsChange((prev) => {
      const next = new Set(customizationAttributes.map((attribute) => attribute.id));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) {
        return prev;
      }
      return next;
    });

    onFormStateChange((prev) => {
      let next = prev;
      for (const attribute of customizationAttributes) {
        next = ensureFormStateForAttribute(next, attribute);
      }
      return next;
    });
  }, [customizationAttributes, onFormStateChange, onSelectedAttributeIdsChange]);

  const renderAttributeCards = (items: Attribute[]) =>
    items.map((attribute) => (
      <ProductCustomizationAttributeCard
        key={attribute.id}
        attribute={attribute}
        formState={formState}
        onFormStateChange={onFormStateChange}
        exclusionValueActions={exclusionValueActions}
      />
    ));

  if (customizationAttributes.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('admin.products.add.pdpCustomizationTitle')}
        </h2>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          {t('admin.products.add.pdpCustomizationEmpty')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('admin.products.add.pdpCustomizationTitle')}
      </h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div
          className={
            showSideBySide
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'
              : 'grid grid-cols-1 gap-6'
          }
        >
          {addition.length > 0 ? (
            <div className="space-y-6 min-w-0">{renderAttributeCards(addition)}</div>
          ) : null}
          {exclusion.length > 0 ? (
            <div className="space-y-6 min-w-0">{renderAttributeCards(exclusion)}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
