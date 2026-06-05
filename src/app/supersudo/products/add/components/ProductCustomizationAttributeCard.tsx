'use client';

import {
  isAdditionPriceOnlyAttributeKey,
  isExclusionSelectionOnlyAttributeKey,
} from '@/lib/products/pdp-customization-config';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { Attribute } from '../types';
import type { PdpCustomizationFormState, PdpCustomizationValueFormState } from '../utils/pdp-customization-form';

interface ProductCustomizationAttributeCardProps {
  attribute: Attribute;
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

export function ProductCustomizationAttributeCard({
  attribute,
  formState,
  onFormStateChange,
}: ProductCustomizationAttributeCardProps) {
  const { t } = useTranslation();
  const priceOnly = isAdditionPriceOnlyAttributeKey(attribute.key);
  const selectionOnly = isExclusionSelectionOnlyAttributeKey(attribute.key);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">{attribute.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{attribute.key}</p>
      </div>
      <div className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
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
            const showPrice = row.enabled && priceOnly;
            const showRoleOptions = row.enabled && !priceOnly && !selectionOnly;

            return (
              <div key={value.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) =>
                      onFormStateChange((prev) =>
                        updateValueRow(prev, value.id, {
                          enabled: e.target.checked,
                          ...(priceOnly && e.target.checked ? { role: 'addon' as const } : {}),
                          ...(selectionOnly && e.target.checked ? { role: 'default' as const } : {}),
                        }),
                      )
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{value.label}</span>
                </label>

                {showRoleOptions ? (
                  <div className="flex flex-wrap items-center gap-4 flex-1">
                    <fieldset className="flex items-center gap-3">
                      <legend className="sr-only">{t('admin.products.add.pdpCustomizationRole')}</legend>
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
                  </div>
                ) : null}

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
            );
          })
        )}
      </div>
    </div>
  );
}
