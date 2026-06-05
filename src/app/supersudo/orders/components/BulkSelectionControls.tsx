'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card, Button } from '@shop/ui';

interface BulkSelectionControlsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  bulkDeleting: boolean;
  paidCount: number;
}

export function BulkSelectionControls({
  selectedCount,
  onBulkDelete,
  bulkDeleting,
  paidCount,
}: BulkSelectionControlsProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;
  const deleteDisabled = !hasSelection || bulkDeleting;

  if (!hasSelection) {
    return null;
  }

  return (
    <Card className="mb-6 w-full min-w-0 rounded-2xl border border-[#dfe6e0] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 text-sm font-medium text-[#4f6458]">
          {t('admin.orders.selectedOrders').replace('{count}', selectedCount.toString())} • Վճարված՝ {paidCount}
        </div>
        <Button
          variant="outline"
          type="button"
          className="shrink-0 rounded-xl border-[#d8dfd8] bg-white text-[#2e4f3f] hover:bg-[#eff4ef]"
          onClick={onBulkDelete}
          disabled={deleteDisabled}
        >
          {bulkDeleting ? t('admin.orders.deleting') : t('admin.orders.deleteSelected')}
        </Button>
      </div>
    </Card>
  );
}

