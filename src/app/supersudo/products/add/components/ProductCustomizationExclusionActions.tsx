'use client';

import { useTranslation } from '../../../../../lib/i18n-client';

interface ProductCustomizationExclusionActionsProps {
  attributeId: string;
  draftLabel: string;
  valueError: string | null;
  isAdding: boolean;
  deletingValueId: string | null;
  onDraftLabelChange: (value: string) => void;
  onAddValue: () => void;
  onDeleteValue: (valueId: string, valueLabel: string) => void;
  valueId: string;
  valueLabel: string;
  showAddRow: boolean;
}

export function ProductCustomizationExclusionDeleteButton({
  deletingValueId,
  valueId,
  valueLabel,
  onDeleteValue,
}: Pick<
  ProductCustomizationExclusionActionsProps,
  'deletingValueId' | 'valueId' | 'valueLabel' | 'onDeleteValue'
>) {
  const { t } = useTranslation();
  const isDeleting = deletingValueId === valueId;

  return (
    <button
      type="button"
      onClick={() => onDeleteValue(valueId, valueLabel)}
      disabled={isDeleting}
      className="ml-auto text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors shrink-0"
      title={t('admin.attributes.deleteValue')}
      aria-label={t('admin.attributes.deleteValue')}
    >
      {isDeleting ? (
        <span className="block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}

export function ProductCustomizationExclusionAddRow({
  attributeId,
  draftLabel,
  valueError,
  isAdding,
  onDraftLabelChange,
  onAddValue,
}: Pick<
  ProductCustomizationExclusionActionsProps,
  'attributeId' | 'draftLabel' | 'valueError' | 'isAdding' | 'onDraftLabelChange' | 'onAddValue'
>) {
  const { t } = useTranslation();

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex flex-wrap gap-2 items-start">
        <div className="flex-1 min-w-[10rem]">
          <input
            type="text"
            value={draftLabel}
            onChange={(e) => onDraftLabelChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draftLabel.trim()) {
                e.preventDefault();
                onAddValue();
              }
            }}
            placeholder={t('admin.products.add.pdpCustomizationAddValuePlaceholder')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent transition-colors ${
              valueError
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            aria-invalid={Boolean(valueError)}
            aria-describedby={valueError ? `pdp-exclusion-error-${attributeId}` : undefined}
          />
          {valueError ? (
            <p id={`pdp-exclusion-error-${attributeId}`} className="mt-1 text-xs text-red-600">
              {valueError}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onAddValue}
          disabled={!draftLabel.trim() || isAdding}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {isAdding ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('admin.attributes.adding')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.attributes.add')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
