'use client';

import { useTranslation } from '../../../lib/i18n-client';

export function AttributesPageLoading() {
  const { t } = useTranslation();

  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      <p className="text-sm text-gray-600">{t('admin.attributes.loadingAttributes')}</p>
    </div>
  );
}
