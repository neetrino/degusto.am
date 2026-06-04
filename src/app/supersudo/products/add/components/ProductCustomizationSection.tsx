'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { Attribute } from '../types';
import {
  disableAttributeValuesInFormState,
  ensureFormStateForAttribute,
  getSelectedCustomizationAttributes,
  type PdpCustomizationFormState,
  type PdpCustomizationValueFormState,
} from '../utils/pdp-customization-form';

interface ProductCustomizationSectionProps {
  attributes: Attribute[];
  selectedAttributeIds: Set<string>;
  onSelectedAttributeIdsChange: (updater: (prev: Set<string>) => Set<string>) => void;
  formState: PdpCustomizationFormState;
  onFormStateChange: (updater: (prev: PdpCustomizationFormState) => PdpCustomizationFormState) => void;
}

function updateValueRow(
  prev: PdpCustomizationFormState,
  valueId: string,
  patch: Partial<PdpCustomizationValueFormState>,
): PdpCustomizationFormState {
  const current = prev[valueId];
  if (!current) {
    return prev;
  }
  return { ...prev, [valueId]: { ...current, ...patch } };
}

export function ProductCustomizationSection({
  attributes,
  selectedAttributeIds,
  onSelectedAttributeIdsChange,
  formState,
  onFormStateChange,
}: ProductCustomizationSectionProps) {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAttributes = useMemo(
    () => getSelectedCustomizationAttributes(attributes, selectedAttributeIds),
    [attributes, selectedAttributeIds],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleAttributeToggle = (attribute: Attribute, checked: boolean) => {
    if (checked) {
      onSelectedAttributeIdsChange((prev) => new Set([...prev, attribute.id]));
      onFormStateChange((prev) => ensureFormStateForAttribute(prev, attribute));
    } else {
      onSelectedAttributeIdsChange((prev) => {
        const next = new Set(prev);
        next.delete(attribute.id);
        return next;
      });
      onFormStateChange((prev) => disableAttributeValuesInFormState(prev, attribute));
    }
  };

  if (attributes.length === 0) {
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
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {t('admin.products.add.pdpCustomizationTitle')}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {t('admin.products.add.pdpCustomizationDescription')}
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.products.add.pdpCustomizationSelectAttribute')}
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm flex items-center justify-between"
            >
              <span className="text-gray-700">
                {selectedAttributeIds.size === 0
                  ? t('admin.products.add.pdpCustomizationSelectAttributePlaceholder')
                  : selectedAttributeIds.size === 1
                    ? t('admin.products.add.attributeSelected').replace('{count}', '1')
                    : t('admin.products.add.attributesSelected').replace(
                        '{count}',
                        String(selectedAttributeIds.size),
                      )}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  dropdownOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen ? (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-y-auto">
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attributes.map((attribute) => (
                    <label
                      key={attribute.id}
                      className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2.5 rounded-lg border transition-colors ${
                        selectedAttributeIds.has(attribute.id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAttributeIds.has(attribute.id)}
                        onChange={(e) => handleAttributeToggle(attribute, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{attribute.name}</span>
                      <span className="text-xs text-gray-400">({attribute.key})</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {selectedAttributeIds.size > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedAttributes.map((attribute) => (
              <span
                key={attribute.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
              >
                {attribute.name}
                <button
                  type="button"
                  onClick={() => handleAttributeToggle(attribute, false)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none"
                  aria-label={t('admin.products.add.remove')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {selectedAttributeIds.size === 0 ? (
          <p className="text-sm text-gray-500 rounded-lg bg-gray-50 border border-dashed border-gray-200 px-4 py-6 text-center">
            {t('admin.products.add.pdpCustomizationPickAttributeFirst')}
          </p>
        ) : (
          <div className="space-y-6 pt-2">
            {selectedAttributes.map((attribute) => (
              <div
                key={attribute.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">{attribute.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{attribute.key}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {attribute.values.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      {t('admin.products.add.pdpCustomizationNoValues')}
                    </p>
                  ) : (
                    attribute.values.map((value) => {
                      const row = formState[value.id];
                      if (!row) {
                        return null;
                      }
                      const showPrice = row.enabled && row.role === 'addon';

                      return (
                        <div
                          key={value.id}
                          className="flex flex-wrap items-center gap-3 px-4 py-3"
                        >
                          <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) =>
                                onFormStateChange((prev) =>
                                  updateValueRow(prev, value.id, { enabled: e.target.checked }),
                                )
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">{value.label}</span>
                          </label>

                          {row.enabled ? (
                            <div className="flex flex-wrap items-center gap-4 flex-1">
                              <fieldset className="flex items-center gap-3">
                                <legend className="sr-only">
                                  {t('admin.products.add.pdpCustomizationRole')}
                                </legend>
                                <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`pdp-role-${value.id}`}
                                    checked={row.role === 'default'}
                                    onChange={() =>
                                      onFormStateChange((prev) =>
                                        updateValueRow(prev, value.id, { role: 'default' }),
                                      )
                                    }
                                    className="text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  {t('admin.products.add.pdpCustomizationRoleDefault')}
                                </label>
                                <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`pdp-role-${value.id}`}
                                    checked={row.role === 'addon'}
                                    onChange={() =>
                                      onFormStateChange((prev) =>
                                        updateValueRow(prev, value.id, { role: 'addon' }),
                                      )
                                    }
                                    className="text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  {t('admin.products.add.pdpCustomizationRoleAddon')}
                                </label>
                              </fieldset>

                              {showPrice ? (
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                  <span>{t('admin.products.add.pdpCustomizationPrice')}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={row.priceAdjustment}
                                    onChange={(e) =>
                                      onFormStateChange((prev) =>
                                        updateValueRow(prev, value.id, {
                                          priceAdjustment: e.target.value,
                                        }),
                                      )
                                    }
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <span className="text-gray-500">֏</span>
                                </label>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
