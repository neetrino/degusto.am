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
    <Card className="mb-6 w-full min-w-0 p-4">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 text-sm text-gray-700">
          {t('admin.products.selectedProducts').replace('{count}', selectedCount.toString())}
        </div>
        <Button
          variant="outline"
          type="button"
          className="shrink-0"
          onClick={onBulkDelete}
          disabled={deleteDisabled}
        >
          {bulkDeleting ? t('admin.products.deleting') : t('admin.products.deleteSelected')}
        </Button>
      </div>
    </Card>
  );
}
