'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Button, Card } from '@shop/ui';

interface ProductBulkSelectionBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  bulkDeleting: boolean;
}

export function ProductBulkSelectionBar({
  selectedCount,
  onBulkDelete,
  bulkDeleting,
}: ProductBulkSelectionBarProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;
  const deleteDisabled = !hasSelection || bulkDeleting;

  return (
    <Card className="mb-6 w-full min-w-0 rounded-2xl border border-[#dfe6e0] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 text-sm font-medium text-[#53675b]">
          {t('admin.products.selectedProducts').replace('{count}', selectedCount.toString())}
        </div>
        <Button
          variant="outline"
          type="button"
          className="shrink-0 rounded-xl border-[#d8dfd8] bg-white text-[#2e4f3f] hover:bg-[#eff4ef]"
          onClick={onBulkDelete}
          disabled={deleteDisabled}
        >
          {bulkDeleting ? t('admin.products.deleting') : t('admin.products.deleteSelected')}
        </Button>
      </div>
    </Card>
  );
}
