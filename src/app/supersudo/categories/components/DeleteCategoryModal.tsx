'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  categoryTitle: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteCategoryModal({
  isOpen,
  categoryTitle,
  deleting,
  onCancel,
  onConfirm,
}: DeleteCategoryModalProps) {
  const { t } = useTranslation();
  useBodyScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('admin.common.delete')}</h3>
        <p className="text-sm leading-6 text-gray-600">
          {t('admin.categories.deleteConfirm').replace('{name}', categoryTitle)}
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={deleting} className="min-w-24">
            {t('admin.common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              void onConfirm();
            }}
            disabled={deleting}
            className="min-w-24 !bg-red-600 !text-white hover:!bg-red-700 focus:!ring-red-600"
          >
            {deleting ? `${t('admin.common.delete')}...` : t('admin.common.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
